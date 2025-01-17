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

const redirectUri = 'https://flowfy.duckdns.org/api/auth/outlook/callback';

router.get('/api/auth/outlook', (req, res) => {
  const { email, returnTo } = req.query;
  console.log(`Initiating Outlook OAuth2 flow for email: ${email}`);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!returnTo) {
    return res.status(400).json({ error: 'ReturnTo is required' });
  }

  // Get the platform from query params passed by ServiceTemplate.jsx
  const isMobile = req.query.platform === 'mobile';
  console.log('Platform:', req.query.platform);
  console.log('Is Mobile:', isMobile);

  const params = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: outlookScopes.join(' '),
    response_mode: 'query',
    state: JSON.stringify({ email, returnTo, isMobile })
  });

  res.redirect(`${OUTLOOK_AUTH_URL}?${params.toString()}`);
});

router.get('/api/auth/outlook/callback', async (req, res) => {
  const { code, state } = req.query;
  const { email, returnTo, isMobile } = JSON.parse(state);

  try {
    console.log(`Received callback for email: ${email}`);

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

    const service_id = await getServiceByName('Outlook');
    const existingUserService = await getUserIdByEmail(email);
    const refreshToken = tokens.refresh_token || existingUserService?.refresh_token;

    await createUserServiceEMAIL(email, service_id, tokens.access_token, refreshToken, true);

    if (isMobile) {
      console.log('Redirecting to mobile app...');
      res.send(`
        <html>
          <body>
            <script>
              window.location.replace("flowfy://oauth/callback?email=${encodeURIComponent(email)}&token=${encodeURIComponent(tokens.access_token)}");
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
    console.error('Error during Outlook OAuth2 callback:', error);
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