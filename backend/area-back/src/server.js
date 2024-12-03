const express = require('express');
const users = require('./crud_users');
const services = require('./crud_services');
const actions = require('./crud_actions');
const reactions = require('./crud_reactions');
const app = express();
const port = 3000;
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();
const csrfProtection = require('./middlewares/csrfProtection');
const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost',
    credentials: true,
}));
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
app.use(csrfProtection);

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback'
);

const jwtSecret = process.env.JWT_SECRET;

app.get('/api/auth/google', (req, res) => {
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

app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });

        const userInfo = await oauth2.userinfo.get();
        const user = userInfo.data;

        // Always update the user's refresh token
        await users.createUser(user.email, [], true, tokens.access_token, tokens.refresh_token);

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            jwtSecret,
            { expiresIn: '1h' }
        );

        res.send(
            `<script>
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
            </script>`
        );
    } catch (error) {
        console.error('Error during Google authentication:', error);
        res.redirect('/');
    }
});

app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to regenerate session' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Logged out successfully' });
        });
    });
});

app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

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
    const { email, areas, is_logged, accessToken, refreshToken } = req.body;
    try {
        await users.createUser(email, areas, is_logged, accessToken, refreshToken);
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

app.get('/get-user-by-email', async (req, res) => {
  const { email } = req.query;
  try {
    const result = await users.getUserByEmail(email);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user');
  }
});

app.get('/isUserLogged', async (req, res) => {
  const { email } = req.query;
  try {
    const result = await users.isUserLogged(email);
    if (result) {
      const isLogged = result.is_logged; // Extract the is_logged field
      res.status(200).json({ is_logged: isLogged }); // Send proper JSON response
    } else {
      res.status(404).json({ is_logged: false }); // User not found
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user');
  }
});

app.get('/setUserLoggedStatus', async (req, res) => {
  const { email, status } = req.query;
  try {
    await users.setUserLoggedStatus(email, status);
    res.status(200).send('User logged status updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating user logged status');
  }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
