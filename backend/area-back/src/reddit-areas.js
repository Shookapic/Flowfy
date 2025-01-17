const snoowrap = require('snoowrap');
const { getUserServiceByEmailAndServiceName } = require('./crud_user_services');
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

// Store last checked subscriptions for each user
const lastCheckedSubs = new Map();
// Store initial subscription lists
const initialSubscriptions = new Map();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'https://flowfy.duckdns.org/api/auth/spotify/callback'
});

async function OnNewSavedPost(email) {
  try {
    const redditService = await getUserServiceByEmailAndServiceName(email, 'Reddit');
    if (!redditService) throw new Error('Reddit service not connected');

    const reddit = new snoowrap({
      userAgent: 'Flowfy/1.0.0 (by /u/No-Donut-3306)',
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      accessToken: redditService.access_token,
      refreshToken: redditService.refresh_token
    });

    const savedContent = await reddit.getMe().getSavedContent().fetchAll();
    
    if (!lastCheckedSubs.has(email)) {
      lastCheckedSubs.set(email, new Set(savedContent.map(post => post.id)));
      return null;
    }

    const lastSavedIds = lastCheckedSubs.get(email);
    const newPost = savedContent.find(post => !lastSavedIds.has(post.id));

    if (newPost) {
      lastSavedIds.add(newPost.id);
      return {
        title: newPost.title,
        url: newPost.url,
        subreddit: newPost.subreddit_name_prefixed,
        author: newPost.author.name
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking saved posts:', error);
    throw error;
  }
}

async function RcreatePlaylistFromSub(email, savedPost) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  async function retry(fn, retries = MAX_RETRIES) {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retry(fn, retries - 1);
    }
  }

  try {
    const spotifyService = await getUserServiceByEmailAndServiceName(email, 'Spotify');
    if (!spotifyService) throw new Error('Spotify service not connected');

    // Set up Spotify API with retries
    await retry(async () => {
      spotifyApi.setAccessToken(spotifyService.access_token);
      spotifyApi.setRefreshToken(spotifyService.refresh_token);
      const refreshResponse = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(refreshResponse.body.access_token);
    });

    // Create playlist with retries
    const playlist = await retry(async () => {
      return spotifyApi.createPlaylist(`Reddit: ${savedPost.title}`, {
        description: `Playlist created from saved Reddit post from ${savedPost.subreddit}`,
        public: true,
        collaborative: false
      });
    });

    console.log('Created playlist:', playlist.body.name);
    return {
      status: 'success',
      playlistId: playlist.body.id,
      name: playlist.body.name
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    return {
      status: 'error', 
      message: error.message
    };
  }
}

module.exports = {
  OnNewSavedPost,
  RcreatePlaylistFromSub
};