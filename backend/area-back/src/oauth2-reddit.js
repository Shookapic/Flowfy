const express = require('express');
const router = express.Router();
const { getUserIdByEmail, createUserServiceID } = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');
require('dotenv').config();

// Reddit OAuth2 configuration
const redditApi = {
  userAgent: 'Flowfy/1.0.0',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  redirectUri: 'http://flowfy.duckdns.org:3000/api/auth/reddit/callback'
};

// Reddit auth route
router.get('/api/auth/reddit', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).send('Email is required');
  }

  try {
    // Verify user exists
    const userId = await getUserIdByEmail(email);
    if (!userId) {
      return res.status(404).send('User not found');
    }

    const state = JSON.stringify({ email, userId });
    const authUrl = `https://www.reddit.com/api/v1/authorize?` +
      `client_id=${redditApi.clientId}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}` +
      `&redirect_uri=${encodeURIComponent(redditApi.redirectUri)}` +
      `&duration=permanent` +
      `&scope=identity edit flair history read vote submit`;

    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Reddit auth:', error);
    res.redirect(`http://flowfy.duckdns.org/reddit-service?connected=false&error=${encodeURIComponent(error.message)}`);
  }
});

// Reddit callback route
router.get('/api/auth/reddit/callback', async (req, res) => {
  const { code, state } = req.query;
  const { email, userId } = JSON.parse(state);

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${redditApi.clientId}:${redditApi.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redditApi.redirectUri
      })
    });

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get service ID for Reddit
    const serviceId = await getServiceByName('Reddit');
    if (!serviceId) {
      throw new Error('Reddit service not found in database');
    }

    // Create or update user service with is_logged=true
    await createUserServiceID(
      userId,
      serviceId, 
      tokens.access_token,
      tokens.refresh_token || null,
      true
    );

    console.log('Reddit auth successful:', { email, userId, serviceId });
    res.redirect('http://flowfy.duckdns.org/spotify-service?connected=true');
  } catch (error) {
    console.error('Error during Reddit OAuth2 callback:', error);
    res.redirect(`http://flowfy.duckdns.org/reddit-service?connected=false&error=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;