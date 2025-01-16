/**
 * @file oauth2-github.js
 * @description Express router module for handling GitHub OAuth2 authentication.
 */

const express = require('express');
const { google } = require('googleapis');
const { getUserIdByEmail, createUserServiceEMAIL, getAccessTokenByEmailAndServiceName } = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');
require('dotenv').config();

const router = express.Router();
const passport = require('./auth');
const bodyParser = require('body-parser');

// Middleware
// app.use(bodyParser.json());
// app.use(passport.initialize());
// app.use(passport.session());

/**
 * Route for initiating GitHub authentication.
 * @name GET /api/auth/github
 * @function
 * @memberof module:oauth2-github
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.email - The email address of the user.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
*/
router.get('/api/auth/github', (req, res, next) => {
  const { email, returnTo } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!returnTo) {
    return res.status(400).json({ error: 'ReturnTo is required' });
  }

  console.log('email for github auth:', email);
  passport.authenticate('github', {
    scope: ['user:email', 'user:follow', 'repo'], // Request email access from GitHub
    state: JSON.stringify({ email, returnTo }), // Embed email and returnTo in state
  })(req, res, next);
});

/**
 * Route for handling GitHub authentication callback.
 * @name GET /api/auth/github/callback
 * @function
 * @memberof module:oauth2-github
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.state - The state parameter containing the email and returnTo.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
router.get(
  '/api/auth/github/callback',
  (req, res, next) => {
    console.log('in GitHub callback:');
    passport.authenticate('github', { failureRedirect: '/' }, async (err, user, info) => {
      console.log('passport authenticate:', { err, user, info });
      if (err || !user) {
        console.error('GitHub authentication error:', err || info);
        return res.redirect('/');
      }

      try {
        // Extract the state parameter (contains the email and returnTo)
        const { state } = req.query;
        const { email, returnTo } = JSON.parse(state);

        // Use the email and user information for SQL queries
        console.log(`Email from frontend: ${email}`);
        console.log(`GitHub User: ${user.profile.username}`);
        const service_id = await getServiceByName('Github');

        // Example: Save GitHub user info to the database with the provided email
        await createUserServiceEMAIL(email, service_id, user.accessToken, null, true);

        res.redirect(`${returnTo}?connected=true`); // Redirect after success
      } catch (error) {
        console.error('Error in GitHub callback processing:', error);
        res.redirect(`${returnTo}?connected=false`); // Redirect after failure
      }
    })(req, res, next);
  }
);


/**
 * Route for logging out the user.
 * @name GET /logout
 * @function
 * @memberof module:oauth2-github
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

module.exports = router;