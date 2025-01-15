/**
 * @file oauth2-routes.js
 * @description Express router module for handling Google OAuth2 authentication.
 */

const express = require('express');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const users = require('./crud_users');
const userService = require('./crud_user_services');
const passport = require('passport'); // Ensure Passport.js is required
require('dotenv').config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://flowfy.duckdns.org:3000/api/auth/google/callback'
);

const jwtSecret = process.env.JWT_SECRET;

/**
 * Route for initiating Google authentication.
 * @name GET /api/auth/google
 * @function
 * @memberof module:oauth2-routes
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
router.get('/api/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'consent' // Ensure a new refresh token is issued every time
    });
    res.redirect(url);
});

/**
 * Route for handling Google authentication callback.
 * @name GET /api/auth/google/callback
 * @function
 * @memberof module:oauth2-routes
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.code - The authorization code returned by Google.
 * @param {Object} res - The response object.
 */
router.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    console.log('Code reçu:', code);
    console.log('User-Agent:', req.headers['user-agent']);

    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Tokens générés:', tokens);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });

        const userInfo = await oauth2.userinfo.get();
        console.log('Infos utilisateur:', userInfo.data);
        const user = userInfo.data;

        // Update user and service info
        await users.createUser(user.email, [], true, tokens.access_token, tokens.refresh_token);
        await userService.createUserServiceEMAIL(user.email, 8, tokens.access_token, tokens.refresh_token, true);
        console.log('Utilisateur créé ou mis à jour dans la base de données');

        // Check for mobile client
        const isMobileClient = req.headers['user-agent'] && (
            req.headers['user-agent'].includes('Capacitor') ||
            req.headers['user-agent'].includes('Android') ||
            req.headers['user-agent'].includes('Mobile')
        );

        console.log('Is mobile client:', isMobileClient);

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            jwtSecret,
            { expiresIn: '1h' }
        );

        if (isMobileClient) {
            console.log('Redirecting to mobile app...');
            res.send(`
                <html>
                    <body>
                        <script>
                            window.location.replace("flowfy://oauth/callback?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}");
                        </script>
                    </body>
                </html>
            `);
        } else {
            res.send(`
                <script>
                    window.opener.postMessage({
                        success: true,
                        token: '${token}',
                        user: {
                            id: '${user.id}',
                            name: '${user.name}',
                            email: '${user.email}'
                        }
                    }, '*');
                    window.close();
                </script>
            `);
        }
    } catch (error) {
        console.error('Error during Google authentication:', error);
        res.redirect('http://flowfy.duckdns.org/login');
    }
});

/**
 * Route for logging out the user.
 * @name GET /api/auth/logout
 * @function
 * @memberof module:oauth2-routes
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
router.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
