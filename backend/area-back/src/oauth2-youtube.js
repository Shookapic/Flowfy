/**
 * @file oauth2-youtube.js
 * @description Express router module for handling YouTube OAuth2 authentication.
 */

const express = require('express');
const { google } = require('googleapis');
const { getUserIdByEmail, createUserServiceEMAIL } = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');
require('dotenv').config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  'https://flowfy.duckdns.org/api/auth/youtube/callback'
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.readonly'
];

/**
 * Route for initiating YouTube authentication.
 * @name GET /api/auth/youtube
 * @function
 * @memberof module:oauth2-youtube
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.email - The email address of the user.
 * @param {Object} res - The response object.
 */
router.get('/api/auth/youtube', (req, res) => {
  const { email } = req.query;
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force reauthorization to get a refresh token
    scope: scopes,
    state: JSON.stringify({ email }),
  });  
  res.redirect(url);
});

/**
 * Route for handling YouTube authentication callback.
 * @name GET /api/auth/youtube/callback
 * @function
 * @memberof module:oauth2-youtube
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.code - The authorization code returned by YouTube.
 * @param {string} req.query.state - The state parameter containing the email.
 * @param {Object} res - The response object.
 */
router.get('/api/auth/youtube/callback', async (req, res) => {
  const { code, state } = req.query;
  const { email } = JSON.parse(state);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve existing user service record to check for an existing refresh token
    const service_id = await getServiceByName('YouTube');
    const existingUserService = await getUserIdByEmail(email);

    // Use the new access token and fallback to the stored refresh token if missing
    const refreshToken = tokens.refresh_token || existingUserService?.refresh_token;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    await createUserServiceEMAIL(email, service_id, tokens.access_token, refreshToken, true);
    console.log('YouTube tokens:', tokens);
    res.redirect('https://flowfy.duckdns.org/youtube-service');
  } catch (error) {
    console.error('Error during YouTube OAuth2 callback:', error);
    res.redirect('https://flowfy.duckdns.org/youtube-service');
  }
});

module.exports = router;