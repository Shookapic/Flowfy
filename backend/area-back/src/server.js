const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const csrfProtection = require('./middlewares/csrfProtection');
const youtubeAuth = require('./oauth2-youtube');
const { onLike, subscribeToChannel } = require('./youtube-areas');
const { getUsers } = require('./crud_users');
const areasFunctions = require('./areas_functions.json');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost',
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
const crudRoutes = require('./crud-routes');

app.use(youtubeAuth);
app.use(oauth2Routes);
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

          if (typeof actionModule[action.function] === 'function' && typeof reactionModule[reaction.function] === 'function') {
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

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app;
