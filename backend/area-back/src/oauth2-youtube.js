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
  'http://localhost:3000/api/auth/youtube/callback'
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.readonly'
];

// Route for initiating YouTube authentication
router.get('/api/auth/youtube', (req, res) => {
  const { email } = req.query;
  console.log(`Initiating YouTube OAuth2 flow for email: ${email}`);
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force reauthorization to get a refresh token
    scope: scopes,
    state: JSON.stringify({ email }),
  });  
  res.redirect(url);
});

// Route for handling YouTube authentication callback
router.get('/api/auth/youtube/callback', async (req, res) => {
  const { code, state } = req.query;
  const { email } = JSON.parse(state);

  try {
    console.log(`Received callback for email: ${email}`);
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log(`Successfully obtained tokens for email: ${email}`);

    const service_id = await getServiceByName('YouTube');
    const existingUserService = await getUserIdByEmail(email);

    const refreshToken = tokens.refresh_token || existingUserService?.refresh_token;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    await createUserServiceEMAIL(email, service_id, tokens.access_token, refreshToken, true);

    console.log(`Successfully connected YouTube service for email: ${email}`);
    
    // Send connection status back as a query parameter
    res.redirect(`http://localhost:8000/youtube-service?connected=true`);
  } catch (error) {
    console.error('Error during YouTube OAuth2 callback:', error);

    console.log(`Failed to connect YouTube service for email: ${email}`);
    
    // Handle errors and redirect with a failure status
    res.redirect(`http://localhost:8000/youtube-service?connected=false`);
  }
});

module.exports = router;
