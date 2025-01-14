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

    // Get user's saved tracks with retry logic
    const response = await fetchWithRetry(() => spotifyApi.getMySavedTracks({ limit: 1 }), 3000, 2000);
    console.log('User saved tracks fetched successfully');

    if (response.body.items.length === 0) {
      console.log('No saved tracks found');
      return null;
    }

    const latestTrack = response.body.items[0].track;
    const lastChecked = lastCheckTimes.get(email);

    // If this is the first check, just store the latest track without triggering
    if (!lastChecked) {
      console.log('First check - storing current liked song as reference');
      lastCheckTimes.set(email, {
        id: latestTrack.id,
        name: latestTrack.name,
        artist: latestTrack.artists[0].name,
        url: latestTrack.external_urls.spotify,
        timestamp: Date.now()
      });
      return null;
    }

    // Only trigger if we find a different song than last check
    if (lastChecked.id !== latestTrack.id) {
      console.log('New liked song detected:', {
        name: latestTrack.name,
        artist: latestTrack.artists[0].name,
        url: latestTrack.external_urls.spotify
      });

      // Update last checked track
      lastCheckTimes.set(email, {
        id: latestTrack.id,
        name: latestTrack.name,
        artist: latestTrack.artists[0].name,
        url: latestTrack.external_urls.spotify,
        timestamp: Date.now()
      });

      return {
        id: latestTrack.id,
        name: latestTrack.name,
        artist: latestTrack.artists[0].name,
        url: latestTrack.external_urls.spotify
      };
    }
    return null; // No new liked song found
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
async function RpostPlaylistToReddit(email, type = 'playlist', content = null) {
  try {
    // Get Spotify service info
    const spotifyService = await fetchWithRetry(async () => {
      const service = await getUserServiceByEmailAndServiceName(email, 'Spotify');
      if (!service) throw new Error('Spotify service not connected');
      return service;
    }, 3, 2000);

    // Set Spotify tokens
    spotifyApi.setAccessToken(spotifyService.access_token);
    spotifyApi.setRefreshToken(spotifyService.refresh_token);

    // Get content based on type if not provided
    if (!content) {
      if (type === 'playlist') {
        const response = await fetchWithRetry(() => spotifyApi.getUserPlaylists(), 3, 2000);
        if (!response?.body?.items?.length) {
          throw new Error('No playlists found');
        }
        content = {
          type: 'playlist',
          name: response.body.items[0].name,
          url: response.body.items[0].external_urls.spotify
        };
      } else if (type === 'like') {
        const response = await fetchWithRetry(() => spotifyApi.getMySavedTracks({ limit: 1 }), 3, 2000);
        if (!response?.body?.items?.length) {
          throw new Error('No liked songs found');
        }
        const track = response.body.items[0].track;
        content = {
          type: 'track',
          name: track.name,
          artist: track.artists[0].name,
          url: track.external_urls.spotify
        };
      }
    }

    // Rest of the Reddit posting logic...
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

    // Initialize Reddit API and post with appropriate title based on content type
    const reddit = new snoowrap({
      userAgent: 'Flowfy/1.0.0',
      accessToken: redditService.access_token,
      refreshToken: redditService.refresh_token,
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET
    });

    const subreddit = await reddit.getSubreddit('spotify');
    const flairs = await subreddit.getLinkFlairTemplates();

    // Select appropriate flair based on content type
    const flair = content.type === 'playlist' ?
      flairs.find(f => f.flair_text === 'Theme/Setting  (Party, Study, Covers, etc)') :
      flairs.find(f => f.flair_text === 'Self Promo');

    if (!flair) {
      throw new Error('No suitable flair found');
    }

    const title = content.type === 'playlist' ?
      `Check out my Spotify playlist: ${content.name}` :
      `Check out this song: ${content.name} by ${content.artist}`;

    const post = await subreddit.submitLink({
      title,
      url: content.url,
      resubmit: true,
      sendReplies: true,
      flair_id: flair.flair_template_id,
      flair_text: flair.flair_text
    });

    return {
      status: 'success',
      postId: post.id,
      url: post.url,
      title: post.title,
      contentType: content.type
    };

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
