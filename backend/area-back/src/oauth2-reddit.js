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

router.get('/api/auth/reddit', async (req, res) => {
  const { email, returnTo } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!returnTo) {
    return res.status(400).json({ error: 'ReturnTo is required' });
  }

  // Add debug logs for platform detection
  console.log('Query params:', req.query);
  const isMobile = req.query.platform === 'mobile';
  console.log('Platform:', req.query.platform);
  console.log('Is Mobile:', isMobile);

  const state = JSON.stringify({ email, returnTo, isMobile });
  
  // Log state to verify mobile flag is included
  console.log('State:', state);

  const params = new URLSearchParams({
    client_id: redditApi.clientId,
    response_type: 'code',
    state: state,
    redirect_uri: redditApi.redirectUri,
    duration: 'permanent',
    scope: 'identity edit flair history read vote submit'
  });

  const authUrl = `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  console.log('Redirecting to:', authUrl);
  res.redirect(authUrl);
});

router.get('/api/auth/reddit/callback', async (req, res) => {
  const { code, state } = req.query;
  const { email, returnTo, isMobile } = JSON.parse(state);

  try {
    console.log(`Received callback for email: ${email}`);
    
    // Exchange code for access token
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
      throw new Error('Failed to obtain access token');
    }

        const service_id = await getServiceByName('Reddit');
    await createUserServiceID(email, service_id, tokens.access_token, tokens.refresh_token, true);
    
    console.log('isMobile:', isMobile);
    if (isMobile) {
      console.log('Mobile redirect - Debug info:');
      console.log('email:', email);
      console.log('token:', tokens.access_token);
    
      // Send HTML with additional logging and force close
      res.send(`
        <html>
          <body>
            <script>
              console.log("Starting mobile redirect...");
              // Add delay before redirect to ensure window.close works
              setTimeout(function() {
                console.log("Redirecting to app...");
                window.location.replace("flowfy://oauth/callback?email=${encodeURIComponent(email)}&token=${encodeURIComponent(tokens.access_token)}");
                console.log("Setting close timeout...");
                // Force close after redirect
                setTimeout(function() {
                  console.log("Closing window...");
                  window.close();
                }, 1000);
              }, 100);
            </script>
            <p>Redirecting to Flowfy app...</p>
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