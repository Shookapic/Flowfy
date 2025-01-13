  /**
 * @file server.js
 * @description Main server file for the application, setting up Express server and routes.
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const csrfProtection = require('./middlewares/csrfProtection');
const youtubeAuth = require('./oauth2-youtube');
const discordAuth = require('./oauth2-discord');
const { onLike, subscribeToChannel } = require('./youtube-areas');
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { fetchRepositories, compareRepositories, AonRepoCreation, AonRepoDeletion, RcreateRepo, RfollowUser, RfollowUsersFromFile } = require('./github-areas');
const { storeNewUser } = require('./discord-areas');
const { getUsers } = require('./crud_users');
const { getAccessTokenByEmailAndServiceName } = require('./crud_user_services');
const areasFunctions = require('./areas_functions.json');

const app = express();
const port = 3000;
let storedRepositories = [];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Required for guildMemberAdd
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required for reading message content
  ],
});

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

app.use(youtubeAuth);
app.use(discordAuth);
app.use(oauth2Routes);
app.use(oauthGithub);
app.use(crudRoutes);

/**
 * Route for handling YouTube like action.
 * @name POST /api/youtube/on-like
 * @function
 * @memberof module:server
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.email - The email address of the user.
 * @param {Object} res - The response object.
 */
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

/**
 * Function to run AREAS actions and reactions.
 * @async
 * @function runAREAS
 * @memberof module:server
 */
async function runAREAS() {
  if (isRunning) {
    // console.log('runAREAS is already running. Skipping this interval.');
    return;
  }

  // console.log('///Running AREAS...///');
  isRunning = true;

  try {
    const users = await getUsers();
    // console.log(users);
    for (const user of users) {
      const { email, areas } = user;
      for (const area of areas) {
        const [actionId, reactionId] = area.split(':');
        const action = areasFunctions.actions[actionId];
        const reaction = areasFunctions.reactions[reactionId];

        if (action && reaction) {
          const actionModule = require(action.file);
          const reactionModule = require(reaction.file);
          // console.log('AREAS:', action, reaction);

          if (typeof actionModule[action.function] === 'function' && typeof reactionModule[reaction.function] === 'function') {
            // console.log('Running AREAS:', action, reaction);
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

/**
 * Route for fetching GitHub repositories.
 * @name GET /api/github/fetch-repositories
 * @function
 * @memberof module:server
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.email - The email address of the user.
 * @param {Object} res - The response object.
 */
app.get('/api/github/fetch-repositories', async (req, res) => {
  const { email } = req.query;
  const accessToken = process.env.GITHUB_ACCESS_TOKEN;
  storedRepositories = await fetchRepositories(accessToken);
  res.status(200).send('Repositories fetched');
});

/**
 * Route for getting stored GitHub repositories.
 * @name GET /api/github/repos
 * @function
 * @memberof module:server
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/api/github/repos', async (req, res) => {
  console.log('repositories:', storedRepositories);
  res.status(200).json(storedRepositories);
});

/**
 * Route for handling GitHub repository creation action.
 * @name GET /api/github/on-repo-creation
 * @function
 * @memberof module:server
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
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

/**
 * Route for handling GitHub repository deletion action.
 * @name GET /api/github/on-repo-deletion
 * @function
 * @memberof module:server
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
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

/**
 * Route for comparing GitHub repositories.
 * @name GET /api/github/compare-repos
 * @function
 * @memberof module:server
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
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

/**
 * Route for creating a GitHub repository.
 * @name GET /api/github/create-repo
 * @function
 * @memberof module:server
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/api/github/create-repo', async (req, res) => {
  try {
    const response = await RcreateRepo(process.env.GITHUB_ACCESS_TOKEN);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error creating repository:', error);
    res.status(500).json({ error: 'Failed to create repository' });
  }
});

/**
 * Route for following users on GitHub.
 * @name GET /api/github/follow-users
 * @function
 * @memberof module:server
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/api/github/follow-users', async (req, res) => {
  try {
    const response = await RfollowUsersFromFile(process.env.GITHUB_ACCESS_TOKEN);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});
// When the bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Listen for messages
client.on('messageCreate', (message) => {
  if (message.author.bot) return; // Ignore bot messages

  if (message.content === '!ping') {
      message.reply('Pong!');
  }
});

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN);

// Listen for messages
client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Ignore bot messages

  // Example command to fetch friend list
  if (message.content === '!friends') {
      // Fetch the user's friend list
      try {
        message.reply('Fetching your friends.');
        const guild = await message.guild.members.fetch();
        const friendList = guild.map(member => member.user.tag); // Simulating friends from guild members
        message.channel.send(`Friends in this server: ${friendList.join(', ')}`);
      } catch (error) {
          console.error('Error fetching friends:', error);
          message.reply('Sorry, there was an error fetching your friends.');
      }
  }
});

client.on('messageCreate', async (message) => {
  if (message.content === '!getfriends') {
    try {
      // Fetch guild members (the bot must have access to the guild)
      const guild = await message.guild.members.fetch();
      const friendList = guild.map(member => member.user.tag); // Simulating friends from guild members
      message.channel.send(`Friends in this server: ${friendList.join(', ')}`);
    } catch (error) {
      message.channel.send('Error fetching friends.');
    }
  }
});

// Trigger
client.on('guildMemberAdd', async (member) => {
  const guildName = member.guild.name; // Get the name of the guild
  const guildId = member.guild.id; // Get the ID of the guild
  const userTag = `${member.user.username}#${member.user.discriminator}`; // Get the user's tag

  console.log(`New member joined: ${userTag}`);
  console.log(`Joined Server: ${guildName} (ID: ${guildId})`);

  // Pass member and guild info to the storeNewUser function
  await storeNewUser(member, { guildName, guildId });
});

client.on('guildBanAdd', async (ban) => {
  console.log(`User banned: ${ban.user.tag}`);
});

if (process.env.NODE_ENV !== 'test') {
  setInterval(runAREAS, 10 * 1000);
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app;