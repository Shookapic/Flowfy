const axios = require('axios');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const csrfProtection = require('./middlewares/csrfProtection');
const youtubeAuth = require('./oauth2-youtube');
const gmailAuth = require('./oauth2-gmail');
const calendarAuth = require('./oauth2-calendar');
const { onLike, subscribeToChannel } = require('./youtube-areas');
const { AlistEmails, AonStarEmails, AonSentEmailWithEventPattern, RsendReply, RsendReplyStarredMail } = require('./gmail-areas');
const { RcreateCalendarEvent } = require('./calendar-areas');
const { fetchRepositoriesName, AfollowUser, fetchAndUpdateFollowing, RupdateFollowingRepo, fetchRepositories, fetchFollowing, fetch3LatestRepos, Rstar3LatestRepos, RaddReadme, compareRepositories, AonRepoCreation, AonRepoDeletion, RcreateRepo, RfollowUser, RfollowUsersFromFile} = require('./github-areas');
const { getUsers } = require('./crud_users');
const { getAccessTokenByEmailAndServiceName } = require('./crud_user_services');
const areasFunctions = require('./areas_functions.json');

const app = express();
const port = 3000;
let storedRepositories = [];
let storedRepos = [];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:8000',
    credentials: true,
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

const oauth2Routes = require('./oauth2-routes');
const oauthGithub = require('./oauth2-github');
const crudRoutes = require('./crud-routes');

app.use(calendarAuth);
app.use(youtubeAuth);
app.use(gmailAuth);
app.use(oauth2Routes);
app.use(oauthGithub);
app.use(crudRoutes);

app.post('/api/youtube/on-like', async (req, res) => {
  const { email } = req.body;

  try {
    await onLike(email); // Ensure onLike handles all necessary logic
    await subscribeToChannel(email); // Pass the oauth2Client directly
    res.status(200).send('Action created for liked video and subscription initiated');
  } catch (error) {
    res.status(500).send('Error creating action for liked video or subscription initiation');
  }
});

let isRunning = false;

async function runAREAS() {
  if (isRunning) {
    console.log('runAREAS is already running. Skipping this interval.');
    return;
  }

  isRunning = true;

  try {
    const users = await getUsers();
    console.log(users);
    for (const user of users) {
      const { email, areas } = user;
      for (const area of areas) {
        const [actionId, reactionId] = area.split(':');
        const action = areasFunctions.actions[actionId];
        const reaction = areasFunctions.reactions[reactionId];

        if (action && reaction) {
          const actionModule = require(action.file);
          const reactionModule = require(reaction.file);
          console.log('AREAS:', action, reaction);

          if (typeof actionModule[action.function] === 'function' && typeof reactionModule[reaction.function] === 'function') {
            console.log('Running AREAS:', action, reaction);
              await actionModule[action.function](email);
              await reactionModule[reaction.function](email);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error running AREAS:', error);
  } finally {
    isRunning = false;
  }
}

// Run the runAREAS function every 5 minutes
setInterval(runAREAS, 10 * 1000);

app.get('/api/github/fetch-repos-name', async (req, res) => {
  const { email } = req.query;
  const accessToken = process.env.GITHUB_ACCESS_TOKEN;
  storedRepositories = await fetchRepositoriesName(accessToken);
  res.status(200).send('Repositories fetched');
});

app.get('/api/github/fetch-repos', async (req, res) => {
  const { email } = req.query;
  const accessToken = process.env.GITHUB_ACCESS_TOKEN;
  storedRepos = await fetchRepositories(accessToken);
  res.status(200).send('Repositories fetched');
});

app.get('/api/github/repos', async (req, res) => {
  console.log('repositories:', storedRepositories);
  res.status(200).json(storedRepositories);
});

app.get('/api/github/on-repo-creation', async (req, res) => {
  try {
    // Ensure the comparison is awaited
    const { newRepos } = await AonRepoCreation(storedRepositories);

    if (newRepos.length > 0) {
      // Update storedRepositories with the fetched ones
      storedRepositories = await fetchRepositories(process.env.GITHUB_ACCESS_TOKEN);
    }

    // Return the results
    res.status(200).json({ newRepos });
  } catch (error) {
    console.error('Error comparing repositories:', error);
    res.status(500).json({ error: 'Failed to compare repositories' });
  }
});

app.get('/api/github/on-repo-creation-add-readme', async (req, res) => {
  try {
    // Fetch the current list of repositories
    const currentRepositories = await fetchRepositories(process.env.GITHUB_ACCESS_TOKEN);

    // Compare with storedRepositories to find new repositories
    const newRepos = currentRepositories.filter(
      (repo) => !storedRepos.some((storedRepo) => storedRepo.name === repo.name)
    );

    // If new repositories are found, call the /create-readme endpoint for each
    const baseURL = `${req.protocol}://${req.get('host')}`; // Build the base URL dynamically

    for (const newRepo of newRepos) {
      console.log(`New repository detected: ${newRepo.name}`);
      await axios.get(`${baseURL}/api/github/create-readme`, {
        params: {
          repoName: newRepo.name,
          repoOwner: newRepo.owner.login,
        },
      });
    }

    // Update the storedRepositories to include the latest ones
    // storedRepositories = currentRepositories;

    res.status(200).json({ message: 'Checked for new repositories', newRepos });
  } catch (error) {
    console.error('Error detecting new repositories:', error);
    res.status(500).json({ error: 'Failed to detect new repositories' });
  }
});

app.get('/api/github/on-repo-deletion', async (req, res) => {
  try {
    // Ensure the comparison is awaited
    const { removedRepos } = await AonRepoDeletion(storedRepositories);

    if (removedRepos.length > 0) {
      // Update storedRepositories with the fetched ones
      storedRepositories = fetchedRepos;
    }

    // Return the results
    res.status(200).json({ removedRepos });
  } catch (error) {
    console.error('Error comparing repositories:', error);
    res.status(500).json({ error: 'Failed to compare repositories' });
  }
});

app.get('/api/github/compare-repos', async (req, res) => {
  try {
    // Ensure the comparison is awaited
    const { newRepos, removedRepos, fetchedRepos } = await compareRepositories(storedRepositories);

    // Update storedRepositories with the fetched ones
    storedRepositories = fetchedRepos;

    // Return the results
    res.status(200).json({ newRepos, removedRepos });
  } catch (error) {
    console.error('Error comparing repositories:', error);
    res.status(500).json({ error: 'Failed to compare repositories' });
  }
});

app.get('/api/github/create-repo', async (req, res) => {
  try {
    const response = await RcreateRepo(process.env.GITHUB_ACCESS_TOKEN);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error creating repository:', error);
    res.status(500).json({ error: 'Failed to create repository' });
  }
});

app.get('/api/github/repos-latest', async (req, res) => {
  const { username } = req.query;
  try {
    const response = await fetch3LatestRepos(username);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching repository:', error);
    res.status(500).json({ error: 'Failed to fetch repository' });
  }
});

app.get('/api/github/star-repos', async (req, res) => {
  const { username } = req.query;
  try {
    const response = await Rstar3LatestRepos();
    res.status(200).json(response);
  } catch (error) {
    console.error('Error starring repository:', error);
    res.status(500).json({ error: 'Failed to star repository' });
  }
});

app.get('/api/github/create-readme', async (req, res) => {
  try {
    const { repoName, repoOwner } = req.query; // Pass repoName and repoOwner dynamically
    if (!repoName || !repoOwner) {
      return res.status(400).json({ error: 'Missing required query parameters: repoName, repoOwner' });
    }

    // Call RaddReadme to add the README.md
    await RaddReadme(process.env.GITHUB_ACCESS_TOKEN, repoOwner, repoName);

    res.status(200).json({ message: `README.md added to repository: ${repoName}` });
  } catch (error) {
    console.error('Error adding README.md:', error);
    res.status(500).json({ error: 'Failed to add README.md' });
  }
});

app.get('/api/github/new-following', async (req, res) => {
  try {
    const { email } = req.query;
    await AfollowUser(email);
    const response = await RupdateFollowingRepo(email);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

app.get('/api/github/following', async (req, res) => {
  try {
    const { email } = req.query;
    const response = await fetchAndUpdateFollowing(email);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

app.get('/api/github/follow-users', async (req, res) => {
  try {
    const response = await RfollowUsersFromFile(process.env.GITHUB_ACCESS_TOKEN);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

app.get('/api/gmail/mails', async (req, res) => {
  try {
    const { email } = req.query;
    const response = await AlistEmails(email);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/gmail/reply', async (req, res) => {
  try {
    const { email } = req.query;
    const response = await RsendReply(email);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/gmail/events', async (req, res) => {
  try {
    const { email } = req.query;
    const response = await AonSentEmailWithEventPattern(email);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/gmail/calendar', async (req,res) => {
  try {
    const { email } = req.query;
    const response = await RcreateCalendarEvent(email);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/gmail/reply-starred', async (req,res) => {
  try {
    const { email } = req.query;
    const response = await RsendReplyStarredMail(email);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/gmail/starred', async (req,res) => {
  try {
    const { email } = req.query;
    const response = await AonStarEmails(email);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app;
