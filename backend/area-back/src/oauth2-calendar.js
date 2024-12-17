const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const { OAuth2 } = google.auth;
const { getUserIdByEmail, createUserService } = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');
const express = require('express');
require('dotenv').config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.CALENDAR_CLIENT_ID,
  process.env.CALENDAR_CLIENT_SECRET,
  'http://localhost:3000/api/auth/calendar/callback'
);

// Scopes you want to request for Gmail API
const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];

// Create an OAuth2 client
router.get('/api/auth/calendar', (req, res) => {
  const { email } = req.query;
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force reauthorization to get a refresh token
    scope: SCOPES,
    state: JSON.stringify({ email }),
  });
  res.redirect(url);
});

router.get('/api/auth/calendar/callback', async (req, res) => {
  const { code, state } = req.query;
  const { email } = JSON.parse(state);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve existing user service record to check for an existing refresh token
    const service_id = await getServiceByName('Calendar');
    const existingUserService = await getUserIdByEmail(email);

    // Use the new access token and fallback to the stored refresh token if missing
    const refreshToken = tokens.refresh_token || existingUserService?.refresh_token;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    await createUserService(email, service_id, tokens.access_token, refreshToken, true);
    res.redirect('http://localhost:8000/services');
  } catch (error) {
    console.error('Error during Calendar OAuth2 callback:', error);
    res.redirect('http://localhost:8000/services');
  }
});

module.exports = router;
