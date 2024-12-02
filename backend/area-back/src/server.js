const express = require('express');
const passport = require('passport');
const session = require('express-session');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const csrfProtection = require('./middlewares/csrfProtection');
require('./config/passportConfig');
const { generateToken } = require('./config/jwtConfig');
const cookieParser = require('cookie-parser');

// Apply CSRF protection to all sensitive routes

const app = express();

// Middlewares
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

// CSRF protection
app.use(csrfProtection);

const jwtSecret = process.env.JWT_SECRET;


// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
},
(accessToken, refreshToken, profile, done) => {
    // Save user information for session
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Enable CORS for frontend
app.use(cors({
    origin: 'http://localhost:8000', // Frontend URL
    credentials: true,
}));
// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Routes
app.get('/', (req, res) => {
    res.send('Home Page');
});

// Error handling for CSRF
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ message: 'Invalid CSRF token' });
    }
    next(err);
});

// Google Auth routes
app.get('/api/auth/google', (req, res, next) => {
    const email = req.query.email || ''; // Optionally pass an email from the frontend
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        login_hint: email
    })(req, res, next);
});

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        const user = req.user;

        // Generate a JWT
        const token = jwt.sign(
            { id: user.id, name: user.displayName, email: user.emails[0].value },
            jwtSecret,
            { expiresIn: '1h' }
        );

        // Send script to close the popup and send data to the parent window
        res.send(
            `<script>
                // Pass the data back to the opener (parent window)
                window.opener.postMessage({
                    success: true,
                    token: '${token}',
                    user: {
                        id: '${user.id}',
                        name: '${user.displayName}',
                        email: '${user.emails[0].value}'
                    }
                }, '*');
                // Close the popup
                window.close();
            </script>`
        );
    }
);

// Route to fetch user info after login
app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

// Logout route
app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to regenerate session' });
            }
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.json({ message: 'Logged out successfully' });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
