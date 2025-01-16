/**
 * @file oauth2-twitter.js
 * @description Express router module for handling Twitter OAuth2 authentication.
 */

const express = require('express');
const { TwitterApi } = require('twitter-api-v2');
const { getUserIdByEmail, createUserServiceID } = require('./crud_user_services'); // Import the functions
require('dotenv').config();

const router = express.Router();

const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

const callbackURL = 'https://flowfy.duckdns.org/api/auth/twitter/callback';

/**
 * Route for initiating Twitter authentication.
 * @name GET /api/auth/twitter
 * @function
 * @memberof module:oauth2-twitter
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.email - The email address of the user.
 * @param {Object} res - The response object.
 */
router.get('/api/auth/twitter', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send('Email is required');
  }

  try {
    const userId = await getUserIdByEmail(email);

    if (!userId) {
      return res.status(404).send('User not found');
    }

    req.session.userId = userId;

    const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(callbackURL, {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    });

    req.session.codeVerifier = codeVerifier;
    req.session.state = state;

    console.log('Stored state:', state);

    req.session.save(() => {
      res.redirect(url);
    });
  } catch (error) {
    console.error('Error fetching user ID:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * Route for handling Twitter authentication callback.
 * @name GET /api/auth/twitter/callback
 * @function
 * @memberof module:oauth2-twitter
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.state - The state parameter returned by Twitter.
 * @param {string} req.query.code - The authorization code returned by Twitter.
 * @param {Object} res - The response object.
 */
router.get('/api/auth/twitter/callback', async (req, res) => {
  const { state, code } = req.query;

  console.log('Received state:', state);
  console.log('Session state:', req.session.state);

  if (state !== req.session.state) {
    return res.status(400).send('State mismatch');
  }

  try {
    const { client: loggedClient, accessToken, refreshToken } = await twitterClient.loginWithOAuth2({
      code,
      codeVerifier: req.session.codeVerifier,
      redirectUri: callbackURL,
    });

    // Fetch user information
    const { data: user } = await loggedClient.v2.me();

    // Store accessToken and refreshToken in the database
    const service_id = await getServiceByName('Twitter');
    console.log(`Service ID: ${service_id}`);
    await createUserServiceID(req.session.userId, service_id, accessToken, refreshToken, true);
    console.log(`User ${user.username} connected to Twitter`);

    res.json({
      message: 'Twitter authentication successful',
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error during Twitter authentication:', error);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;