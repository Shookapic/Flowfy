/**
 * @file oauth2-github.js
 * @description Express router module for handling GitHub OAuth2 authentication.
 */

const express = require('express');
const { getUserIdByEmail, createUserServiceEMAIL } = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');
require('dotenv').config();

const router = express.Router();
const passport = require('./auth');

/**
 * Route for initiating GitHub authentication.
 * @name GET /api/auth/github
 * @function
 * @memberof module:oauth2-github
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.email - The email address of the user.
 * @param {string} req.query.returnTo - The return URL after authentication.
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

  // Get the platform from query params passed by ServiceTemplate.jsx
  const isMobile = req.query.platform === 'mobile';
  console.log('Platform:', req.query.platform);
  console.log('Is Mobile:', isMobile);

  console.log('email for github auth:', email);
  passport.authenticate('github', {
    scope: ['user:email', 'user:follow', 'repo'],
    state: JSON.stringify({ email, returnTo, isMobile }), // Add isMobile to state
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
        const { state } = req.query;
        const { email, returnTo, isMobile } = JSON.parse(state);

        console.log(`Email from frontend: ${email}`);
        console.log(`GitHub User: ${user.profile.username}`);
        const service_id = await getServiceByName('Github');

        await createUserServiceEMAIL(email, service_id, user.accessToken, null, true);

        if (isMobile) {
          console.log('Redirecting to mobile app...');
          res.send(`
            <html>
              <body>
                <script>
                  window.location.replace("flowfy://oauth/callback?email=${encodeURIComponent(email)}&token=${encodeURIComponent(user.accessToken)}");
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
        console.error('Error in GitHub callback processing:', error);
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