/**
 * @file oauth2-notion.js
 * @description Express router module for handling Notion OAuth2 authentication.
 */

const express = require('express');
const { getUserIdByEmail, createUserServiceEMAIL } = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');
require('dotenv').config();

const router = express.Router();

const notionClientId = process.env.NOTION_CLIENT_ID;
const notionClientSecret = process.env.NOTION_CLIENT_SECRET;
const notionRedirectUri = 'https://flowfy.duckdns.org/api/auth/notion/callback';

const scopes = [
  'https://www.googleapis.com/auth/notion.force-ssl',
  'https://www.googleapis.com/auth/notion.readonly'
];

// Route for initiating Notion authentication
router.get('/api/auth/notion', (req, res) => {
  const { email, returnTo } = req.query;
  console.log(`Initiating Notion OAuth2 flow for email: ${email}`);
  
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

  const state = JSON.stringify({ email, returnTo, isMobile });
  const url = `https://api.notion.com/v1/oauth/authorize?client_id=${notionClientId}&response_type=code&redirect_uri=${encodeURIComponent(notionRedirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  res.redirect(url);
});

router.get('/api/auth/notion/callback', async (req, res) => {
    const { code, state } = req.query;
    const { email, returnTo, isMobile } = JSON.parse(state);

    try {
        console.log(`Received callback for email: ${email}`);
        
        const response = await fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${notionClientId}:${notionClientSecret}`).toString('base64')}`
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: notionRedirectUri
            })
        });

        const tokens = await response.json();
        if (!tokens.access_token) {
            throw new Error('Failed to obtain access token');
        }

        const service_id = await getServiceByName('Notion');
        const existingUserService = await getUserIdByEmail(email);
        const refreshToken = tokens.refresh_token || existingUserService?.refresh_token || null;
        
        await createUserServiceEMAIL(email, service_id, tokens.access_token, refreshToken, true);

        console.log(`Successfully connected Notion service for email: ${email}`);
        
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
        console.error('Error during Notion OAuth2 callback:', error);
        
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