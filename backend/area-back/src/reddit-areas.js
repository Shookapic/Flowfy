const snoowrap = require('snoowrap');
const { getUserServiceByEmailAndServiceName } = require('./crud_user_services');
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

// Store last checked upvotes for each user
const lastCheckedUpvotes = new Map();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'https://flowfy.duckdns.org:3000/api/auth/spotify/callback'
});

/**
 * Detects when a post is upvoted on Reddit
 * @async
 * @function OnUpvote
 * @param {string} email - The email address of the user
 */
// Fonction corrigée OnUpvote
async function OnUpvote(email) {
    try {
        const redditService = await getUserServiceByEmailAndServiceName(email, 'Reddit');
        if (!redditService) throw new Error('Reddit service not connected');

        const reddit = new snoowrap({
            userAgent: 'Flowfy/1.0.0',
            accessToken: redditService.access_token,
            refreshToken: redditService.refresh_token,
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET
        });

        // Get user info and upvoted posts
        const user = await reddit.getMe();
        const upvoted = await reddit.getUser(user.name).getUpvoted({ limit: 1 });

        if (!upvoted || upvoted.length === 0) {
            console.log('No upvoted posts found');
            return null;
        }

        const latestUpvote = upvoted[0];
        const lastChecked = lastCheckedUpvotes.get(email);

        if (!lastChecked || lastChecked.id !== latestUpvote.id) {
            console.log('New upvote detected:', latestUpvote.title);
            lastCheckedUpvotes.set(email, {
                id: latestUpvote.id,
                title: latestUpvote.title,
                subreddit: latestUpvote.subreddit.display_name
            });
            return latestUpvote;
        }

        console.log('No new upvotes since last check.');
        return null;

    } catch (error) {
        console.error('Error detecting upvote:', error.message);
        throw error;
    }
}

  // Fonction corrigée RcreatePlaylistFromUpvote
  async function RcreatePlaylistFromUpvote(email, upvoteData) {
    try {
      const spotifyService = await getUserServiceByEmailAndServiceName(email, 'Spotify');
      if (!spotifyService) throw new Error('Spotify service not connected');
  
      spotifyApi.setAccessToken(spotifyService.access_token);
      spotifyApi.setRefreshToken(spotifyService.refresh_token);
  
      const refreshResponse = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(refreshResponse.body.access_token);
  
      const playlist = await spotifyApi.createPlaylist(`Reddit: ${upvoteData.title}`, {
        description: `Playlist created from upvoted Reddit post: ${upvoteData.title}`,
        public: true
      });
  
      console.log('Created playlist:', playlist.body.name);
      return { status: 'success', playlistId: playlist.body.id, name: playlist.body.name };
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  }
  
module.exports = {
  OnUpvote,
  RcreatePlaylistFromUpvote
};