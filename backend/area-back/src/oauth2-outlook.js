/**
 * @file oauth2-outlook.js
 * @description Express router module for handling Outlook OAuth2 authentication.
 */

const express = require('express');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
require('dotenv').config();

const { getUserIdByEmail, createUserServiceEMAIL } = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');

const router = express.Router();

const OUTLOOK_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const OUTLOOK_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

const outlookScopes = [
  'offline_access',
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Mail.Send'
];

const redirectUri = 'http://localhost:3000/api/auth/outlook/callback';

// Route for initiating Outlook authentication
router.get('/api/auth/outlook', (req, res) => {
  const { email } = req.query;
  console.log(`Initiating Outlook OAuth2 flow for email: ${email}`);

  const params = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: outlookScopes.join(' '),
    response_mode: 'query',
    state: JSON.stringify({ email })
  });

  res.redirect(`${OUTLOOK_AUTH_URL}?${params.toString()}`);
});

// Route for handling Outlook authentication callback
router.get('/api/auth/outlook/callback', async (req, res) => {
  const { code, state } = req.query;
  const { email } = JSON.parse(state);

  try {
    console.log(`Received callback for email: ${email}`);

    // Exchange code for tokens
    const tokenResponse = await fetch(OUTLOOK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString()
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      throw new Error(tokens.error_description || 'Failed to obtain tokens');
    }

    console.log(`Successfully obtained tokens for email: ${email}`);

    // Retrieve the user's service ID and check for existing records
    const service_id = await getServiceByName('Outlook');
    const existingUserService = await getUserIdByEmail(email);

    const refreshToken = tokens.refresh_token || existingUserService?.refresh_token;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Store the user's service connection details in the database
    await createUserServiceEMAIL(email, service_id, tokens.access_token, refreshToken, true);

    console.log(`Successfully connected Outlook service for email: ${email}`);
    
    // Redirect back with a success query parameter
    res.redirect(`http://localhost/github-service?connected=true`);
  } catch (error) {
    console.error('Error during Outlook OAuth2 callback:', error);

    console.log(`Failed to connect Outlook service for email: ${email}`);

    // Redirect back with a failure query parameter
    res.redirect(`http://localhost/github-service?connected=false`);
  }
});

module.exports = router;
