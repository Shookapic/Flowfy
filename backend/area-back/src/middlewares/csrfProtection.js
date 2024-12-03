const csrf = require('csurf');

// Set up CSRF protection
const csrfProtection = csrf({ cookie: true });

module.exports = csrfProtection;
