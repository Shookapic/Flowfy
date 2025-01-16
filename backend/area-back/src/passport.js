/**
 * @file passport.js
 * @description Configuration for Passport.js with Azure AD OIDC strategy.
 */

const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const passport = require('passport');
require('dotenv').config();

/**
 * Configure Passport to use Azure AD OIDC strategy.
 */
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/<TENANT_ID>/v2.0/.well-known/openid-configuration`,
      clientID: process.env.MICROSOFT_CLIENT_ID,
      responseType: 'code',
      responseMode: 'query',
      redirectUrl: 'https://flowfy.duckdns.org/api/microsoft/callback',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      scope: ['openid', 'profile', 'email'],
    },
    /**
     * Verify callback for Azure AD OIDC strategy.
     * @callback verifyCallback
     * @param {string} iss - Issuer identifier.
     * @param {string} sub - Subject identifier.
     * @param {Object} profile - User profile information.
     * @param {string} accessToken - Access token.
     * @param {string} refreshToken - Refresh token.
     * @param {function} done - Callback function.
     */
    (iss, sub, profile, accessToken, refreshToken, done) => {
      return done(null, { profile, accessToken });
    }
  )
);

/**
 * Serialize user information into the session.
 * @function serializeUser
 * @param {Object} user - User object.
 * @param {function} done - Callback function.
 */
passport.serializeUser((user, done) => done(null, user));

/**
 * Deserialize user information from the session.
 * @function deserializeUser
 * @param {Object} obj - User object.
 * @param {function} done - Callback function.
 */
passport.deserializeUser((obj, done) => done(null, obj));

module.exports = passport;