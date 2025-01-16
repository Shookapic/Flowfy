/**
 * @file oauth2-spotify.js
 * @description Express router module for handling Spotify authentication.
 */
const express = require('express');
const { 
  getUserIdByEmail, 
  createUserServiceID, 
  getUserServiceByEmailAndServiceName, 
  updateUserServiceTokens 
} = require('./crud_user_services');
const { getServiceByName } = require('./crud_services');
require('dotenv').config();
const { URL } = require('url');

const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'https://flowfy.duckdns.org/api/auth/spotify/callback'
});

router.get('/api/auth/spotify', async (req, res) => {
  const { email, returnTo } = req.query;

  if (!email) {
    return res.status(400).send('Email is required');
  }
  if (!returnTo) {
    return res.status(400).send('ReturnTo is required');
  }

  try {
    const userId = await getUserIdByEmail(email);
    if (!userId) {
      return res.status(404).send('User not found');
    }

    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-library-read',
      'user-library-modify'
    ];

    // Generate state
    const state = JSON.stringify({ email, userId, returnTo });
    
    // Store in session
    req.session.spotifyAuth = {
      state,
      userId,
      email
    };

    // Force session save before redirect
    await new Promise((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Always show dialog and include show_dialog parameter
    const authorizeURL = spotifyApi.createAuthorizeURL(
      scopes, 
      state, 
      true // showDialog
    );

    res.redirect(authorizeURL);
  } catch (error) {
    console.error('Error in Spotify auth:', error);
    const redirectUrl = new URL(returnTo);
    redirectUrl.searchParams.set('connected', 'false');
    redirectUrl.searchParams.set('error', encodeURIComponent(error.message));
    res.redirect(redirectUrl.toString());
  }
});

router.get('/api/auth/spotify/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!state) {
    console.error('State parameter is missing');
    return res.redirect('/?connected=false&error=missing_state');
  }

  let parsedState;
  try {
    parsedState = JSON.parse(state);
  } catch (error) {
    console.error('Error parsing state parameter:', error);
    return res.redirect('/?connected=false&error=invalid_state');
  }

  const { email, userId, returnTo } = parsedState;

  try {
    if (!req.session?.spotifyAuth) {
      console.error('No session data found');
      const redirectUrl = new URL(returnTo);
      redirectUrl.searchParams.set('connected', 'false');
      redirectUrl.searchParams.set('error', 'session_expired');
      return res.redirect(redirectUrl.toString());
    }

    if (state !== req.session.spotifyAuth.state) {
      console.error('State mismatch:', {
        received: state,
        expected: req.session.spotifyAuth.state
      });
      const redirectUrl = new URL(returnTo);
      redirectUrl.searchParams.set('connected', 'false');
      redirectUrl.searchParams.set('error', 'state_mismatch');
      return res.redirect(redirectUrl.toString());
    }

    try {
      const existingService = await getUserServiceByEmailAndServiceName(email, 'Spotify');
      
      if (existingService && existingService.refresh_token) {
        spotifyApi.setRefreshToken(existingService.refresh_token);
        const refreshData = await spotifyApi.refreshAccessToken();
        const { access_token } = refreshData.body;
        
        await updateUserServiceTokens(existingService.id, access_token, existingService.refresh_token);
        console.log('Updated existing Spotify connection using refresh token');
      } else {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token } = data.body;

        const service_id = await getServiceByName('Spotify');
        if (!service_id) {
          throw new Error('Spotify service not found in database');
        }

        if (existingService) {
          await updateUserServiceTokens(existingService.id, access_token, refresh_token);
        } else {
          await createUserServiceID(userId, service_id, access_token, refresh_token, true);
        }
      }

      // Clear session
      delete req.session.spotifyAuth;
      await new Promise((resolve, reject) => {
        req.session.save(err => err ? reject(err) : resolve());
      });

      // Redirect with connected=true parameter
      const redirectUrl = new URL(returnTo);
      redirectUrl.searchParams.set('connected', 'true');
      return res.redirect(redirectUrl.toString());

    } catch (error) {
      console.error('Spotify API error:', error);
      const redirectUrl = new URL(returnTo);
      redirectUrl.searchParams.set('connected', 'false');
      redirectUrl.searchParams.set('error', 'api_error');
      return res.redirect(redirectUrl.toString());
    }
  } catch (error) {
    console.error('Final error:', error);
    const redirectUrl = new URL(returnTo);
    redirectUrl.searchParams.set('connected', 'false');
    redirectUrl.searchParams.set('error', encodeURIComponent(error.message));
    return res.redirect(redirectUrl.toString());
  }
});

module.exports = router;