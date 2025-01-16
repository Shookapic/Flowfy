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
  const { email } = req.query;
  console.log(`Initiating Notion OAuth2 flow for email: ${email}`);
  
  const url = `https://api.notion.com/v1/oauth/authorize?client_id=${notionClientId}&response_type=code&redirect_uri=${encodeURIComponent(notionRedirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=${encodeURIComponent(JSON.stringify({ email }))}`;
  res.redirect(url);
});

// Route for handling Notion authentication callback
router.get('/api/auth/notion/callback', async (req, res) => {
    const { code, state } = req.query;
    const { email } = JSON.parse(state);

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

        console.log(`Successfully obtained tokens for email: ${email}`);

        const service_id = await getServiceByName('Notion');
        const existingUserService = await getUserIdByEmail(email);
        console.log("TOOOOOOOOOOOOO tokens", tokens);

        const refreshToken = tokens.refresh_token || existingUserService?.refresh_token || null;
        console.log("-----------------going to create user service with email", email, service_id, tokens.access_token, refreshToken);
        await createUserServiceEMAIL(email, service_id, tokens.access_token, refreshToken, true);

        console.log(`Successfully connected Notion service for email: ${email}`);
        
        // Send connection status back as a query parameter
        res.redirect(`https://flowfy.duckdns.org/github-service?connected=true`);
    } catch (error) {
        console.error('Error during Notion OAuth2 callback:', error);

        console.log(`Failed to connect Notion service for email: ${email}`);
        
        // Handle errors and redirect with a failure status
        res.redirect(`https://flowfy.duckdns.org/github-service?connected=false`);
    }
});

module.exports = router;