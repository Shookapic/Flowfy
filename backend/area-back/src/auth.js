const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configure GitHub OAuth strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.CLIENT_ID_GITHUB,
      clientSecret: process.env.CLIENT_SECRET_GITHUB,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['repo', 'user:email'], // Ensure 'repo' is here
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, { profile, accessToken });
    }
  )
);

module.exports = passport;