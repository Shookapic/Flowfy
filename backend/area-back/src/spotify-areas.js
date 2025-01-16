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
    redirectUri: 'https://flowfy.duckdns.org/api/auth/spotify/callback'
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
    const response = await fetchWithRetry(() => spotifyApi.getUserPlaylists({ limit: 1 }), 30, 2000);
    console.log('User playlists fetched successfully');

    if (response.body.items.length === 0) {
      console.log('No playlists found');
      return null;
    }

    const latestPlaylist = response.body.items[0];
    const lastChecked = lastCheckedPlaylists.get(email);

    // First run - store the latest playlist without triggering
    if (!lastChecked) {
      console.log('First check - storing current playlist as reference');
      lastCheckedPlaylists.set(email, {
        id: latestPlaylist.id,
        name: latestPlaylist.name,
        url: latestPlaylist.external_urls.spotify,
        timestamp: Date.now()
      });
      return null;
    }

    // Only trigger if we find a different playlist than last check
    if (lastChecked.id !== latestPlaylist.id) {
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
        type: 'playlist', // Added type field
        id: latestPlaylist.id,
        name: latestPlaylist.name,
        url: latestPlaylist.external_urls.spotify,
        description: latestPlaylist.description || '',
        title: latestPlaylist.name // Added title field for Reddit post
      };
    }

    console.log('No new playlists since last check');
    return null;
  } catch (error) {
    console.error('Error detecting playlist:', error);
    throw error;
  }
}

/**
 * Detects when a song is liked on Spotify
 * @async
 * @function OnSongLike
 * @param {string} email - The email address of the user
 */
async function OnSongLike(email) {
  try {
    const existingService = await getUserServiceByEmailAndServiceName(email, 'Spotify');
    if (!existingService) {
      throw new Error('Spotify service not connected');
    }

    // Set tokens
    spotifyApi.setAccessToken(existingService.access_token);
    spotifyApi.setRefreshToken(existingService.refresh_token);

    // Get user's saved tracks with retry logic - increase limit to check more songs
    const response = await fetchWithRetry(() => spotifyApi.getMySavedTracks({ limit: 1 }), 3000, 2000);
    console.log('User saved tracks fetched successfully');

    if (response.body.items.length === 0) {
      console.log('No saved tracks found');
      return null;
    }

    const latestTrack = response.body.items[0].track;
    const latestAddedAt = new Date(response.body.items[0].added_at).getTime();
    const lastChecked = lastCheckTimes.get(email);
    
    // On first check, store current time instead of track info
    if (!lastChecked) {
      console.log('First check - storing current timestamp');
      lastCheckTimes.set(email, {
        timestamp: Date.now(),
        lastCheckId: latestTrack.id
      });
      return null;
    }

    // Check if song was liked after our last check
    if (latestAddedAt > lastChecked.timestamp && latestTrack.id !== lastChecked.lastCheckId) {
      console.log('New liked song detected:', {
        name: latestTrack.name,
        artist: latestTrack.artists[0].name,
        url: latestTrack.external_urls.spotify
      });

      // Update last check time and track
      lastCheckTimes.set(email, {
        timestamp: Date.now(),
        lastCheckId: latestTrack.id
      });

      return {
        type: 'track',
        id: latestTrack.id,
        name: latestTrack.name,
        artist: latestTrack.artists[0].name,
        url: latestTrack.external_urls.spotify,
        title: `${latestTrack.name} by ${latestTrack.artists[0].name}`
      };
    }

    console.log('No new liked songs since last check');
    return null;
  } catch (error) {
    console.error('Error detecting liked song:', error);
    throw error;
  }
}
const snoowrap = require('snoowrap'); // Add this at the top with other imports

/**
 * Posts Spotify content to Reddit
 * @async
 * @function RpostPlaylistToReddit
 * @param {string} email - The email address of the user
 * @param {string} type - The type of content ('playlist' or 'like')
 * @param {Object} content - The content to post (optional)
 */
async function RpostPlaylistToReddit(email, actionResult) {
  try {
    // Get Reddit service info with timeout and retries
    const redditService = await fetchWithRetry(async () => {
      const service = await getUserServiceByEmailAndServiceName(email, 'Reddit');
      if (!service) throw new Error('Reddit service not connected');
      return service;
    }, 30, 2000);

    // Validate action result
    if (!actionResult || !actionResult.type) {
      throw new Error('Invalid action result data');
    }

    // Initialize Reddit API with proper error handling
    const reddit = new snoowrap({
      userAgent: 'Flowfy/1.0.0',
      accessToken: redditService.access_token,
      refreshToken: redditService.refresh_token,
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET
    });

    // Set longer timeout for Reddit API calls
    reddit.config({
      requestTimeout: 30000,
      continueAfterRatelimitError: true,
      retryErrorCodes: [502, 503, 504, 522],
      maxRetryAttempts: 3
    });

    try {
      // Get subreddit with retry
      const subreddit = await fetchWithRetry(() => reddit.getSubreddit('spotify'), 300, 2000);
      
      // Get flairs with retry
      const flairs = await fetchWithRetry(() => subreddit.getLinkFlairTemplates(), 300, 2000);

      if (!flairs || flairs.length === 0) {
        throw new Error('No flairs available');
      }

      // Select flair based on content type
      const flair = actionResult.type === 'playlist' ?
        flairs.find(f => f.flair_text === 'Theme/Setting  (Party, Study, Covers, etc)') :
        flairs.find(f => f.flair_text === 'Self Promo');

      if (!flair) {
        console.warn('No matching flair found, proceeding without flair');
      }

      const title = actionResult.type === 'playlist' ?
        `Check out my Spotify playlist: ${actionResult.name}` :
        `Check out this song: ${actionResult.name}`;

      // Submit post with retry
      const post = await fetchWithRetry(() => 
        subreddit.submitLink({
          title,
          url: actionResult.url,
          resubmit: true,
          sendReplies: true,
          ...(flair && {
            flair_id: flair.flair_template_id,
            flair_text: flair.flair_text
          })
        })
      , 30, 2000);

      return {
        status: 'success',
        postId: post.id,
        url: post.url,
        title: post.title,
        contentType: actionResult.type
      };

    } catch (redditError) {
      console.error('Reddit API error:', redditError);
      throw new Error(`Reddit API error: ${redditError.message}`);
    }

  } catch (error) {
    console.error('Error posting to Reddit:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

// Update module exports
module.exports = {
  OnPlaylistCreation,
  OnSongLike,
  RpostPlaylistToReddit
};
