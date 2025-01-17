  /**
 * @file server.js
 * @description Main server file for the application, setting up Express server and routes.
 */

  const path = require('path');
  const fs = require('fs');
  const express = require('express');
  const session = require('express-session');
  const cors = require('cors');
  const cookieParser = require('cookie-parser');
  require('dotenv').config();
  const csrfProtection = require('./middlewares/csrfProtection');
  const youtubeAuth = require('./oauth2-youtube');
  const discordAuth = require('./oauth2-discord');
  const { onLike, subscribeToChannel } = require('./youtube-areas');
  const { fetchRepositories, compareRepositories, AonRepoCreation, AonRepoDeletion, RcreateRepo, RfollowUser, RfollowUsersFromFile } = require('./github-areas');
  const { storeNewUser, client, AonNewServerMember, AonServerCreation } = require('./discord-areas');
  const { getUsers } = require('./crud_users');
  const { getAccessTokenByEmailAndServiceName } = require('./crud_user_services');
  const { fetchFilteredServers, addReactionIdToServer } = require('./crud_discord_queries');
  const areasFunctions = require('./areas_functions.json');
  const spotifyAuth = require('./oauth2-spotify');
  const redditAuth = require('./oauth2-reddit');
  const authRateLimiter = require('./middlewares/rateLimiter'); // Import the rate limiter middleware
  
  const app = express();
  const port = 3000;
  let storedRepositories = [];
  
  app.use(express.json());
  app.use(cookieParser());
  // CORS configuration
  app.use(cors({
      origin: 'https://flowfy.duckdns.org:8080',
      credentials: true,
  }));
  
  // Session configuration
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    name: 'flowfy.session',
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    },
    store: new (require('connect-pg-simple')(session))({
      // Use the proper database connection configuration
      pool: require('./db'),
      tableName: 'session',
      createTableIfMissing: true,
      schemaName: 'public'
    })
  }));
  
  
  // Add Trust Proxy if behind a reverse proxy
  app.set('trust proxy', 1);
  
  // Routes
  const oauth2Routes = require('./oauth2-routes');
  const oauthGithub = require('./oauth2-github');
  const crudRoutes = require('./crud-routes');
  const oauthNotion = require('./oauth2-notion');
  const oauthOutlook = require('./oauth2-outlook');
  const oauthSpotify = require('./oauth2-spotify');
  const oauthReddit = require('./oauth2-reddit');
  
  
  app.use(youtubeAuth);
  app.use(oauth2Routes);
  app.use(oauthGithub);
  app.use(crudRoutes);
  app.use(oauthNotion);
  app.use(oauthOutlook);
  app.use(discordAuth);
  app.use(spotifyAuth);
  app.use(redditAuth);
  
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
              console.log('Running action:', action.name);
              const actionResult = await actionModule[action.function](email);
  
              // Only trigger reaction if action returns a result
              if (actionResult) {
                console.log('Action detected change, running reaction:', reaction.name);
                await reactionModule[reaction.function](email, actionResult);
              } else {
                console.log('No changes detected, skipping reaction');
              }
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
  
  const services = require('./areas_functions.json');
  
  const os = require('os');
  
  app.get('/api/about.json', (req, res) => {
    // Function to get the server's IP address
    const getServerIP = () => {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          // Skip over internal (i.e., 127.0.0.1) and non-IPv4 addresses
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
      return '127.0.0.1'; // Fallback to flowfy.duckdns.org if no external IP found
    };
  
    const serverHost = getServerIP(); // Fetch the server's IP address
    const currentTime = Math.floor(Date.now() / 1000);
  
    const formattedServices = Object.entries(services.actions).reduce((acc, [actionId, action]) => {
      const serviceId = action.file.split('/')[1].split('-')[0];
      const serviceName = serviceId.charAt(0).toUpperCase() + serviceId.slice(1);
  
      let service = acc.find(s => s.name === serviceName);
      if (!service) {
        service = {
          name: serviceName,
          actions: [],
          reactions: []
        };
        acc.push(service);
      }
  
      service.actions.push({
        name: action.function,
        description: action.name,
      });
  
      return acc;
    }, []);
  
    Object.entries(services.reactions).forEach(([reactionId, reaction]) => {
      const serviceId = reaction.file.split('/')[1].split('-')[0];
      const serviceName = serviceId.charAt(0).toUpperCase() + serviceId.slice(1);
  
      let service = formattedServices.find(s => s.name === serviceName);
      if (!service) {
        service = {
          name: serviceName,
          actions: [],
          reactions: []
        };
        formattedServices.push(service);
      }
  
      service.reactions.push({
        name: reaction.function,
        description: reaction.name,
      });
    });
  
    const response = {
      client: {
        host: serverHost, // Use server's IP instead of client's IP
      },
      server: {
        current_time: currentTime,
        services: formattedServices,
      },
    };
  
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(response, null, 2)); // Format the JSON with 2 spaces for indentation
  });
  
  // When the bot is ready
  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    AonNewServerMember('placeholder');
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
  
  client.on('guildBanAdd', async (ban) => {
    console.log(`User banned: ${ban.user.tag}`);
  });
  
  if (process.env.NODE_ENV !== 'test') {
    setInterval(runAREAS, 5 * 1000);
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  }
  
  app.get('/api/discord/server-creation', async (req, res) => {
    try {
      const { email } = req.query;
      console.log('email body is ',email);
      const ownedServers = await AonServerCreation(email);
      if (ownedServers) {
        res.status(200).send('gotem');
      } else {
        res.status(200).send('nun');
      }
    } catch (error) {
      res.status(500).send('Error with servs');
    }
  })
  
  /**
   * @name GET /api/github/test
   * @description Route to test the GitHub API using the authenticated user's access token.
   * @function
   * @memberof module:oauth2-github
   * @param {Object} req - The request object.
   * @param {Object} req.query - The query parameters.
   * @param {string} req.query.email - The email address of the user.
   * @param {Object} res - The response object.
   */
  app.get('/api/github/test', async (req, res) => {
    const { email } = req.query;
  
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
  
    try {
      // Retrieve the user's access token from the database
      const accessToken = await getAccessTokenByEmailAndServiceName(email, 'Github');
  
      if (!accessToken) {
        return res.status(404).json({ error: 'No access token found for this email.' });
      }
  
      // Make a request to the GitHub API
      const response = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`GitHub API returned an error: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      // Send the response data back to the client
      res.status(200).json({
        message: 'GitHub API request successful!',
        data,
      });
    } catch (error) {
      console.error('Error testing GitHub API:', error);
      res.status(500).json({ error: 'Failed to fetch data from GitHub API' });
    }
  });
  
  app.get('/api/discord/new_member', async (req, res) => {
    try {
      const { email } = req.query;
      await AonNewServerMember(email);
      res.status(200).send('aight');
    } catch (error) {
      res.status(500).send('Error with servs');
    }
  })
  
  app.get('/api/docs', (req, res) => {
    const docsDir = path.join(__dirname, 'docs');
    fs.readdir(docsDir, (err, files) => {
      if (err) {
        return res.status(500).send('Error reading docs directory');
      }

      const htmlFiles = files.filter(file => file.endsWith('.html'));
      if (htmlFiles.length === 0) {
        return res.status(404).send('No HTML files found in docs directory');
      }

      const fileLinks = htmlFiles.map(file => `<a href="/api/docs/${file}">${file}</a>`).join('<br>');
      res.send(`<html><body>${fileLinks}</body></html>`);
    });
  });

  app.get('/api/docs/:file', (req, res) => {
    const filePath = path.join(__dirname, 'docs', req.params.file);
    res.sendFile(filePath, err => {
      if (err) {
        res.status(404).send('File not found');
      }
    });
  });

  module.exports = app;
  