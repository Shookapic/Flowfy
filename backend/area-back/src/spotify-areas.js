/**
 * @file spotify-areas.js
 * @description Module for handling Spotify actions and reactions using OAuth2 authentication.
 */

const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');
const { getUserServiceByEmailAndServiceName } = require('./crud_user_services');
require('dotenv').config();

// Store last check time for each user
const lastCheckTimes = new Map();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/api/auth/spotify/callback'
});

async function OnPlaylistCreation(email) {
  try {
    const existingService = await getUserServiceByEmailAndServiceName(email, 'Spotify');
    if (!existingService) {
      throw new Error('Spotify service not connected');
    }

    // Set tokens
    spotifyApi.setAccessToken(existingService.access_token);
    spotifyApi.setRefreshToken(existingService.refresh_token);

    // Get current time
    const currentTime = Date.now();
    const lastCheckTime = lastCheckTimes.get(email) || currentTime;

    // Get user's playlists
    const response = await spotifyApi.getUserPlaylists();
    
    // Filter only new playlists
    const newPlaylists = response.body.items.filter(playlist => {
      const createdAt = new Date(playlist.snapshot_id).getTime();
      return createdAt > lastCheckTime;
    });

    // Update last check time
    lastCheckTimes.set(email, currentTime);

    if (newPlaylists.length === 0) {
      console.log('No new playlists found');
      return null;
    }

    // Get most recent new playlist
    const latestPlaylist = newPlaylists[0];
    console.log('New playlist detected:', latestPlaylist.name);

    return {
      id: latestPlaylist.id,
      name: latestPlaylist.name,
      public: latestPlaylist.public,
      tracks: latestPlaylist.tracks.total,
      url: latestPlaylist.external_urls.spotify
    };

  } catch (error) {
    console.error('Error handling playlist creation:', error);
    if (error.statusCode === 401) {
      console.error('Access token expired, needs refresh');
    }
    return null;
  }
}

module.exports = {
  OnPlaylistCreation
};