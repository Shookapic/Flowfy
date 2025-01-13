const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const session = require("express-session");
require('dotenv').config();
const router = express.Router();
const { getUserIdByEmail, createUserServiceEMAIL, getAccessTokenByEmailAndServiceName, createUserServiceID } = require('./crud_user_services');
const { getServers, getOwnedServers, addServers, getUserFriends, addOwnedServersToDB } = require('./crud_discord_queries');
const { getServiceByName } = require('./crud_services');

// Create an Express application
const app = express();

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

const DISCORD_CALLBACK_URL = "http://localhost:3000/api/auth/discord/callback";
const DISCORD_API_URL = "https://discord.com/api/v10";

// Configure the Discord strategy for use by Passport
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: DISCORD_CALLBACK_URL,
      scope: ["identify", "email", "connections", "bot"],
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);

// Serialize and deserialize user information to support persistent login sessions
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Define the route for initiating Discord authentication
app.get("/api/auth/discord", passport.authenticate("discord"));

router.get('/api/auth/discord', (req, res, next) => {
    const email = req.query.email;
    if (!email) {
        return res.status(400).send('Email is required');
    }
    passport.authenticate('discord', {
        state: JSON.stringify({ email })
    })(req, res, next);
});

// Define the route for handling the OAuth2 callback
router.get('/api/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), async (req, res) => {
    const state = JSON.parse(req.query.state);
    const email = state.email;
    const refreshToken = '';

    const service_id = await getServiceByName('Discord');
    const existingUserService = await getUserIdByEmail(email);
    const user_id = await getUserIdByEmail(email);

    // Use the new access token and fallback to the stored refresh token if missing
    const accessToken = req.user.accessToken || existingUserService?.access_token;

    if (!accessToken) {
        throw new Error('No access token available');
    }

    await createUserServiceID(user_id, service_id, accessToken, refreshToken, true);
    console.log('Discord tokens:', { accessToken, refreshToken });
    console.log("accessToken: " + JSON.stringify(accessToken));
    console.log("refreshToken: " + JSON.stringify(refreshToken));
    return res.redirect('http://localhost:8000/discord-service');
});

// Define the route for displaying the user profile
router.get("/api/discord/profile", async (req, res) => {
  if (!accessToken) {
    return res.status(400).send("Access token is required");
  }

  try {
    const response = await fetch(DISCORD_API_URL + "/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .send("Failed to fetch user data from Discord");
    }

    const userData = await response.json();
    res.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Fetch user's connections
router.get("/api/discord/connections", async (req, res) => {
  if (!accessToken) {
    return res.status(400).send("Access token is required");
  }

  try {
    const response = await fetch(DISCORD_API_URL + "/users/@me/connections", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("response: " + JSON.stringify(response));

    if (!response.ok) {
      return res
        .status(response.status)
        .send("Failed to fetch user connectins from Discord");
    }

    const userData = await response.json();
    res.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Define the route for logging out
router.get("/api/discord/logout", (req, res) => {
  req.logout((err) => {
    accessToken = null;
    if (err) {
      return next(err);
    }
  });
});

router.get("/api/servers", async (req, res) => {
  const { email } = req.query;
  const accessToken = await getAccessTokenByEmailAndServiceName(email, 'Discord');

  if (!accessToken) {
      throw new Error('No access token available');
  }

  const guilds = await getUserGuilds(accessToken);

  if (guilds) {
      res.json({guilds});
  } else {
    res.status(500).send("Internal Server Error");
  }
})

router.get("/db/servers/owned", async (req, res) => {
  const { email } = req.query;

  const guilds = await getOwnedServers(email);

  if (guilds) {
      res.json({guilds});
  } else {
    res.status(500).send("Internal Server Error");
  }
})

router.get("/db/servers/add/owned", async (req, res) => {
  const { email } = req.query;

  const guilds = await getOwnedServers(email);
  console.log("guilds", guilds);
  const queryRes = await addServers(guilds, email);
  if (queryRes) {
      res.status(200).send("added servers");
  } else {
    res.status(500).send("Internal Server Error");
  }
})

router.get("/api/servers/add/owned", async (req, res) => {
  const { email } = req.query;
  const accessToken = await getAccessTokenByEmailAndServiceName(email, 'Discord');

  if (!accessToken) {
    throw new Error('No access token available');
  }

  const queryRes = await addOwnedServersToDB(email, accessToken);

  if (queryRes) {
      res.status(200).send("added servers");
  } else {
    res.status(500).send("Internal Server Error");
  }
})

router.get("/api/friends", async (req, res) => {
  const { email } = req.query;
  const accessToken = await getAccessTokenByEmailAndServiceName(email, 'Discord');

  if (!accessToken) {
      throw new Error('No access token available');
  }

  const friends = await getUserFriends(accessToken);

  if (friends) {
      console.log("friends", friends);
      res.json(200).send("frens");
    } else {
    res.status(500).send("Internal Server Error");
  }
})

router.get("/api/servers/owned", async (req, res) => {
  const { email } = req.query;
  const accessToken = await getAccessTokenByEmailAndServiceName(email, 'Discord');

  if (!accessToken) {
      throw new Error('No access token available');
  }

  const guilds = await getOwnedUserGuilds(accessToken);

  if (guilds) {
      res.json({guilds});
  } else {
    res.status(500).send("Internal Server Error");
  }
})

module.exports = router;
