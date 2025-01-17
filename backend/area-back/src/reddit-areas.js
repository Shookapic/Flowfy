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

/**
 * Detects when a user joins a subreddit
 * @async
 * @function OnSubJoin
 * @param {string} email - The email address of the user
 */
async function OnSubJoin(email) {
  try {
      const redditService = await getUserServiceByEmailAndServiceName(email, 'Reddit');
      if (!redditService) throw new Error('Reddit service not connected');

      // Initialize Reddit client with required scopes
      const reddit = new snoowrap({
          userAgent: 'Flowfy/1.0.0 (by /u/No-Donut-3306)',
          clientId: process.env.REDDIT_CLIENT_ID,
          clientSecret: process.env.REDDIT_CLIENT_SECRET,
          accessToken: redditService.access_token,
          refreshToken: redditService.refresh_token
      });

      // Configure snoowrap
      reddit.config({
          requestDelay: 1000,
          continueAfterRatelimitError: false,
          retryErrorCodes: [502, 503, 504],
          maxRetryAttempts: 3
      });

      // Get user's current subscribed subreddits
      const currentSubs = await reddit.getSubscriptions().fetchAll();
      if (!currentSubs || !currentSubs.length) {
          console.log('No subscriptions found');
          return null;
      }

      // Initialize subscription list for new users
      if (!initialSubscriptions.has(email)) {
          initialSubscriptions.set(email, new Set(currentSubs.map(sub => sub.display_name)));
          return null; // Skip first run to establish baseline
      }

      // Get initial subscription list
      const initialSubs = initialSubscriptions.get(email);
      
      // Find new subscriptions by comparing with initial list
      const newSub = currentSubs.find(sub => !initialSubs.has(sub.display_name));
      
      if (newSub) {
          // Add new subscription to initial list
          initialSubs.add(newSub.display_name);
          
          const subData = {
              name: newSub.display_name,
              title: newSub.title,
              description: newSub.public_description,
              url: `https://reddit.com/r/${newSub.display_name}`
          };
          return subData;
      }

      return null;
  } catch (error) {
      console.error('Error detecting subreddit join:', error);
      throw error;
  }
}

async function RcreatePlaylistFromSub(email, subData) {
    // Maximum number of retries
    const MAX_RETRIES = 3;
    // Delay between retries in ms
    const RETRY_DELAY = 2000;

    // Retry helper function
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
            return spotifyApi.createPlaylist(`Reddit: r/${subData.name}`, {
                description: `Playlist created from joined subreddit: ${subData.title}`,
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
        // Return error object instead of throwing
        return {
            status: 'error',
            message: error.message
        };
    }
}

module.exports = {
  OnSubJoin,
  RcreatePlaylistFromSub
};