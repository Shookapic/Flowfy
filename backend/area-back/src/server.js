const express = require('express');
const users = require('./crud_users');
const services = require('./crud_services');
const actions = require('./crud_actions');
const reactions = require('./crud_reactions');
const app = express();
const port = 3000;
const passport = require('passport');
const session = require('express-session');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const csrfProtection = require('./middlewares/csrfProtection');
require('./config/passportConfig');
const cookieParser = require('cookie-parser');

app.use(express.json());

module.exports = app;

app.get('/users', async (req, res) => {
  try {
    const result = await users.getUsers();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching users');
  }
});

app.post('/add-users', async (req, res) => {
  const { email, areas } = req.body;
  try {
    await users.createUser(email, areas);
    res.status(201).send('User created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating user');
  }
});

app.post('/delete-user', async (req, res) => {
  const { id } = req.body;
  try {
    await users.deleteUser(id);
    res.status(200).send('User deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting user');
  }
});

app.post('/update-user', async (req, res) => {
  const { id, email, areas } = req.body;
  try {
    await users.updateUser(id, email, areas);
    res.status(200).send('User updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating user');
  }
});

app.get('/services', async (req, res) => {
  try {
    const result = await services.getServices();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching services');
  }
});

app.post('/add_services', async (req, res) => {
  const { name } = req.body;
  try {
    await services.createService(name);
    res.status(201).send('Service created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating service');
  }
});

app.post('/delete-service', async (req, res) => {
  const { id } = req.body;
  try {
    await services.deleteService(id);
    res.status(200).send('Service deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting service');
  }
});

app.post('/update-service', async (req, res) => {
  const { id, name } = req.body;
  try {
    await services.updateService(id, name);
    res.status(200).send('Service updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating service');
  }
});

app.get('/reactions', async (req, res) => {
  try {
    const result = await reactions.getReactions();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching reactions');
  }
});

app.post('/add-reactions', async (req, res) => {
  const { serviceId, description } = req.body;
  try {
    await reactions.createReaction(serviceId, description);
    res.status(201).send('Reaction created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating reaction');
  }
});

app.post('/delete-reaction', async (req, res) => {
  const { id } = req.body;
  try {
    await reactions.deleteReaction(id);
    res.status(200).send('Reaction deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting reaction');
  }
});

app.post('/update-reaction', async (req, res) => {
  const { id, description } = req.body;
  try {
    await reactions.updateReaction(id, description);
    res.status(200).send('Reaction updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating reaction');
  }
});

app.post('/actions', async (req, res) => {
  try {
    const result = await actions.getActions();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching actions');
  }
});

app.post('/add-actions', async (req, res) => {
  const { serviceId, description } = req.body;
  try {
    await actions.createAction(serviceId, description);
    res.status(201).send('Action created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating action');
  }
});

app.post('/delete-action', async (req, res) => {
  const { id } = req.body;
  try {
    await actions.deleteAction(id);
    res.status(200).send('Action deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting action');
  }
});

app.post('/update-action', async (req, res) => {
  const { id, description } = req.body;
  try {
    await actions.updateAction(id, description);
    res.status(200).send('Action updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating action');
  }
});

// Middlewares
/**
 * @brief Middleware to parse cookies.
 */
app.use(cookieParser());

/**
 * @brief Middleware to handle sessions.
 */
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

/**
 * @brief Middleware to protect against CSRF attacks.
 */
app.use(csrfProtection);

const jwtSecret = process.env.JWT_SECRET;

// Initialize Passport
/**
 * @brief Middleware to initialize Passport.
 */
app.use(passport.initialize());

/**
 * @brief Middleware to manage user sessions with Passport.
 */
app.use(passport.session());

// Configure Passport strategy
/**
 * @brief Configures Passport to use the Google OAuth 2.0 strategy for authentication.
 */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
},
(accessToken, refreshToken, profile, done) => {
    // Save user information for session
    return done(null, profile);
}));

/**
 * @brief Serializes the user information into the session.
 */
passport.serializeUser((user, done) => done(null, user));

/**
 * @brief Deserializes the user information from the session.
 */
passport.deserializeUser((obj, done) => done(null, obj));

// Enable CORS for frontend
/**
 * @brief Middleware to enable Cross-Origin Resource Sharing (CORS) for the frontend application.
 */
app.use(cors({
    origin: 'http://localhost', // Frontend URL
    credentials: true,
}));

// CSRF token endpoint
/**
 * @brief Endpoint to fetch the CSRF token.
 * @param req The request object.
 * @param res The response object.
 */
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Routes
/**
 * @brief Endpoint to serve the home page.
 * @param req The request object.
 * @param res The response object.
 */
app.get('/', (req, res) => {
    res.send('Home Page');
});

// Error handling for CSRF
/**
 * @brief Middleware to handle CSRF errors.
 * @param err The error object.
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware function.
 */
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ message: 'Invalid CSRF token' });
    }
    next(err);
});

// Google Auth routes
/**
 * @brief Endpoint to initiate Google authentication.
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware function.
 */
app.get('/api/auth/google', (req, res, next) => {
    const email = req.query.email || ''; // Optionally pass an email from the frontend
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'select_account',
        login_hint: email
    })(req, res, next);
});

/**
 * @brief Callback endpoint for Google authentication.
 * @param req The request object.
 * @param res The response object.
 */
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

/**
 * @brief Endpoint to fetch the authenticated user's information.
 * @param req The request object.
 * @param res The response object.
 */
app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

/**
 * @brief Endpoint to log out the user.
 * @param req The request object.
 * @param res The response object.
 */
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

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
