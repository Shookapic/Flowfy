const express = require('express');
const { google } = require('googleapis');
const { getUserIdByEmail, createUserService } = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');
require('dotenv').config();

const router = express.Router();
const passport = require('./auth');
const bodyParser = require('body-parser');

// Middleware
// app.use(bodyParser.json());
// app.use(passport.initialize());
// app.use(passport.session());

// GitHub Auth Routes
router.get('/api/auth/github', (req, res, next) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  passport.authenticate('github', {
    scope: ['user:email'], // Request email access from GitHub
    state: JSON.stringify({ email }), // Embed email in state
  })(req, res, next);
});

router.get(
  '/api/auth/github/callback',
  (req, res, next) => {
    passport.authenticate('github', { failureRedirect: '/' }, async (err, user, info) => {
      if (err || !user) {
        console.error('GitHub authentication error:', err || info);
        return res.redirect('/');
      }

      try {
        // Extract the state parameter (contains the email)
        const { state } = req.query;
        const { email } = JSON.parse(state);

        // Use the email and user information for SQL queries
        console.log(`Email from frontend: ${email}`);
        console.log(`GitHub User: ${user.profile.username}`);
        const service_id = await getServiceByName('Github');

        // Example: Save GitHub user info to the database with the provided email
        await createUserService(email, service_id, user.accessToken, null, true);

        res.redirect('http://flowfy.duckdns.org/github-service'); // Redirect after success
      } catch (error) {
        console.error('Error in GitHub callback processing:', error);
        res.redirect('http://flowfy.duckdns.org/github-service'); // Redirect after success
      }
    })(req, res, next);
  }
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});


module.exports = router;
