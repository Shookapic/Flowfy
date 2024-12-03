const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const csrfProtection = require('./middlewares/csrfProtection');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://flowfy.duckdns.org',
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

// Import routes
const oauth2Routes = require('./oauth2-routes');
const crudRoutes = require('./crud-routes');

// Use routes
app.use(oauth2Routes);
app.use(crudRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://flowfy.duckdns.org:${port}`);
});