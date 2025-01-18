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
  redirectUri: 'https://flowfy.duckdns.org/api/auth/reddit/callback'
};

// Reddit auth route
router.get('/api/auth/reddit', async (req, res) => {
  const { email, returnTo, platform } = req.query;
  
  if (!email) {
    return res.status(400).send('Email is required');
  }
  if (!returnTo) {
    return res.status(400).send('ReturnTo is required');
  }

  try {
    // Verify user exists
    const userId = await getUserIdByEmail(email);
    if (!userId) {
      return res.status(404).send('User not found');
    }

    const isMobile = platform === 'mobile';
    const state = JSON.stringify({ email, userId, returnTo, isMobile });
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
    const redirectUrl = new URL(returnTo);
    redirectUrl.searchParams.set('connected', 'false');
    redirectUrl.searchParams.set('error', encodeURIComponent(error.message));
    res.redirect(redirectUrl.toString());
  }
});

// Reddit callback route
router.get('/api/auth/reddit/callback', async (req, res) => {
  const { code, state } = req.query;
  const { email, userId, returnTo, isMobile } = JSON.parse(state);

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

    if (isMobile) {
      res.send(`
        <html>
          <body>
            <script>
              window.location.replace("flowfy://oauth/callback?email=${encodeURIComponent(email)}&token=${encodeURIComponent(tokens.access_token)}");
              setTimeout(function() {
                window.close();
              }, 1000);
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
    console.error('Error during Reddit OAuth2 callback:', error);
    const redirectUrl = new URL(returnTo);
    redirectUrl.searchParams.set('connected', 'false');
    redirectUrl.searchParams.set('error', encodeURIComponent(error.message));
    res.redirect(redirectUrl.toString());
  }
});

module.exports = router;