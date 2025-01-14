/**
 * @file spotify-areas.js
 * @description Module for handling Spotify actions and reactions using OAuth2 authentication.
 */

const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');
const { getUserServiceByEmailAndServiceName } = require('./crud_user_services');
const { google } = require('googleapis');
require('dotenv').config();

// Store last check time for each user
const lastCheckTimes = new Map();
const lastCheckedPlaylists = new Map();

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/api/auth/spotify/callback'
  });
  
  async function fetchWithRetry(fn, maxRetries = 3000, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  async function OnPlaylistCreation(email) {
    try {
      const existingService = await getUserServiceByEmailAndServiceName(email, 'Spotify');
      if (!existingService) {
        throw new Error('Spotify service not connected');
      }
  
      // Set tokens
      spotifyApi.setAccessToken(existingService.access_token);
      spotifyApi.setRefreshToken(existingService.refresh_token);
  
      // Get user's playlists with retry logic
      const response = await fetchWithRetry(() => spotifyApi.getUserPlaylists(), 3000, 2000);
      console.log('User playlists fetched successfully');
  
      if (response.body.items.length === 0) {
        console.log('No playlists found');
        return null;
      }
  
      const latestPlaylist = response.body.items[0];
      const lastChecked = lastCheckedPlaylists.get(email);
  
      // Check if this is a new playlist
      if (!lastChecked || lastChecked.id !== latestPlaylist.id) {
        console.log('New playlist detected:', {
          name: latestPlaylist.name,
          url: latestPlaylist.external_urls.spotify
        });
  
        // Update last checked playlist
        lastCheckedPlaylists.set(email, {
          id: latestPlaylist.id,
          name: latestPlaylist.name,
          url: latestPlaylist.external_urls.spotify,
          timestamp: Date.now()
        });
  
        return {
          id: latestPlaylist.id,
          name: latestPlaylist.name,
          url: latestPlaylist.external_urls.spotify
        };
      }
      return null; // No new playlist found
    } catch (error) {
      console.error('Error detecting playlist:', error);
      throw error;
    }
  }

const snoowrap = require('snoowrap'); // Add this at the top with other imports

/**
 * Posts the latest Spotify playlist to Reddit
 * @async
 * @function RpostPlaylistToReddit
 * @param {string} email - The email address of the user
 */
async function RpostPlaylistToReddit(email) {
  try {
    // Get Spotify service info with shorter retry
    const spotifyService = await fetchWithRetry(async () => {
      const service = await getUserServiceByEmailAndServiceName(email, 'Spotify');
      if (!service) throw new Error('Spotify service not connected');
      return service;
    }, 3, 2000);

    // Get latest playlist with Spotify API
    spotifyApi.setAccessToken(spotifyService.access_token);
    spotifyApi.setRefreshToken(spotifyService.refresh_token);

    const response = await fetchWithRetry(() => spotifyApi.getUserPlaylists(), 300, 2000);
    if (!response?.body?.items?.length) {
      throw new Error('No playlists found');
    }

    const latestPlaylist = response.body.items[0];
    console.log('Latest Spotify playlist:', {
      name: latestPlaylist.name,
      url: latestPlaylist.external_urls.spotify
    });

    // Get Reddit service
    const redditService = await Promise.race([
      getUserServiceByEmailAndServiceName(email, 'Reddit'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Reddit service timeout')), 5000))
    ]);

    if (!redditService) {
      return {
        status: 'error',
        message: 'Reddit service not connected',
        requiresAuth: true,
        service: 'reddit',
        redirectUrl: `http://localhost:3000/api/auth/reddit?email=${encodeURIComponent(email)}`
      };
    }

    // Initialize Reddit API
    const reddit = new snoowrap({
      userAgent: 'Flowfy/1.0.0',
      accessToken: redditService.access_token,
      refreshToken: redditService.refresh_token,
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET
    });

    // Get subreddit and flair templates with timeout
    const subreddit = await Promise.race([
      reddit.getSubreddit('spotify'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Subreddit fetch timeout')), 10000))
    ]);

    // Get available flairs
    const flairs = await Promise.race([
      subreddit.getLinkFlairTemplates(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Flair fetch timeout')), 10000))
    ]);

    console.log('Available flairs:', flairs);

    // Find a suitable flair (prefer 'Self Promo' or 'Random' flairs)
    const flair = flairs.find(f => 
      f.flair_text === 'Self Promo' || 
      f.flair_text === 'Theme/Setting  (Party, Study, Covers, etc)'
    );

    if (!flair) {
      throw new Error('No suitable flair found');
    }

    // Submit post with flair using correct field names
    const post = await Promise.race([
      subreddit.submitLink({
        title: `Check out my Spotify playlist: ${latestPlaylist.name}`,
        url: latestPlaylist.external_urls.spotify,
        resubmit: true,
        sendReplies: true,
        flair_id: flair.flair_template_id,
        flair_text: flair.flair_text
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Post submission timeout')), 15000))
    ]);

    return {
      status: 'success',
      postId: post.id,
      url: post.url,
      title: post.title,
      flair: flair.flair_text
    };

  } catch (error) {
    console.error('Error posting playlist to Reddit:', error);
    return {
      status: 'error',
      message: error.message || 'Reddit connection timeout'
    };
  }
}

// Add to module exports
module.exports = {
  OnPlaylistCreation,
  RcreatePlaylist,
  RpostPlaylistToReddit
};