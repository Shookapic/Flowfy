/**
 * @file oauth2-spotify.js
 * @description Express router module for handling Spotify authentication.
 */
const express = require('express');
const { 
  getUserIdByEmail, 
  createUserServiceID, 
  getUserServiceByEmailAndServiceName, 
  updateUserServiceTokens 
} = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');
require('dotenv').config();
const { URL } = require('url');

const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'https://flowfy.duckdns.org/api/auth/spotify/callback'
});

router.get('/api/auth/spotify', async (req, res) => {
  const { email, returnTo } = req.query;

  if (!email || !returnTo) {
    return res.status(400).send('Email and returnTo are required');
  }

  try {
    const userId = await getUserIdByEmail(email);
    if (!userId) {
      return res.status(404).send('User not found');
    }

    // Get the platform from query params passed by ServiceTemplate.jsx
    const isMobile = req.query.platform === 'mobile';
    console.log('Platform:', req.query.platform);
    console.log('Is Mobile:', isMobile);

    const state = JSON.stringify({ 
      email, 
      userId, 
      returnTo,
      isMobile // Store the mobile state
    });

    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-library-read',
      'user-library-modify'
    ];

    const authorizeURL = spotifyApi.createAuthorizeURL(
      scopes, 
      state, 
      true
    );

    res.redirect(authorizeURL);
  } catch (error) {
    console.error('Error:', error);
    res.redirect(`${returnTo}?connected=false&error=${encodeURIComponent(error.message)}`);
  }
});

// In the callback route
router.get('/api/auth/spotify/callback', async (req, res) => {
  const { code, state } = req.query;

  try {
    // Add error handling for missing state
    if (!state) {
      throw new Error('Missing state parameter');
    }

    // Fix state parsing with proper error handling
    let parsedState;
    try {
      // First try to decode the state in case it's URI encoded
      const decodedState = decodeURIComponent(state);
      parsedState = JSON.parse(decodedState);
    } catch (parseError) {
      console.error('Failed to parse state:', parseError);
      console.error('Raw state value:', state);
      throw new Error('Invalid state parameter');
    }

    // Validate required state properties
    if (!parsedState.email || !parsedState.returnTo) {
      throw new Error('Missing required state parameters');
    }

    // Destructure with defaults to avoid undefined errors
    const { email, userId = '', returnTo = '/', isMobile = false } = parsedState;

    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;

    const service_id = await getServiceByName('Spotify');
    if (!service_id) {
      throw new Error('Spotify service not found in database');
    }

    await createUserServiceID(userId, service_id, access_token, refresh_token, true);

    if (isMobile) {
      console.log('Redirecting to mobile app...');
      res.send(`
        <html>
          <body>
            <script>
              window.location.replace("flowfy://oauth/callback?email=${encodeURIComponent(email)}&token=${encodeURIComponent(access_token)}");
            </script>
          </body>
        </html>
      `);
    } else {
      const redirectUrl = new URL(returnTo);
      redirectUrl.searchParams.set('connected', 'true');
      res.redirect(redirectUrl.toString());
    }
  } catch (error) {
    console.error('Spotify OAuth error:', error);
    
    // Handle error cases with safe fallbacks
    let email = '';
    let returnTo = 'https://flowfy.duckdns.org';
    let isMobile = false;

    try {
      if (state) {
        const decodedState = decodeURIComponent(state);
        const parsedState = JSON.parse(decodedState);
        email = parsedState.email || '';
        returnTo = parsedState.returnTo || returnTo;
        isMobile = parsedState.isMobile || false;
      }
    } catch (e) {
      console.error('Error parsing state in error handler:', e);
    }

    if (isMobile) {
      res.send(`
        <html>
          <body>
            <script>
              window.location.replace("flowfy://oauth/callback?email=${encodeURIComponent(email)}&connected=false");
            </script>
          </body>
        </html>
      `);
    } else {
      const redirectUrl = new URL(returnTo);
      redirectUrl.searchParams.set('connected', 'false');
      redirectUrl.searchParams.set('error', encodeURIComponent(error.message));
      res.redirect(redirectUrl.toString());
    }
  }
});
module.exports = router;