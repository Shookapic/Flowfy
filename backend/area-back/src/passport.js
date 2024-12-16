const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const passport = require('passport');
require('dotenv').config();

passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/<TENANT_ID>/v2.0/.well-known/openid-configuration`,
      clientID: process.env.MICROSOFT_CLIENT_ID,
      responseType: 'code',
      responseMode: 'query',
      redirectUrl: 'http://flowfy.duckdns.org:3000/api/microsoft/callback',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      scope: ['openid', 'profile', 'email'],
    },
    (iss, sub, profile, accessToken, refreshToken, done) => {
      return done(null, { profile, accessToken });
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
