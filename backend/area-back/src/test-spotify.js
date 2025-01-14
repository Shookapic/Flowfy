const { OnSongLike, RpostPlaylistToReddit } = require('./spotify-areas');

async function testSpotifyLikeToReddit() {
  const testEmail = 'mazeauarthur7@gmail.com';
  const CHECK_INTERVAL = 6000; // 60 seconds = 1 minute

  console.log('Starting Spotify like detection service...');
  console.log('Waiting for new liked songs...');

  // Run the check every minute
  setInterval(async () => {
    try {
      console.log('\nChecking for new liked songs...');
      const likeResult = await OnSongLike(testEmail);
      
      if (likeResult) {
        console.log('New liked song detected:', {
          name: likeResult.name,
          artist: likeResult.artist,
          url: likeResult.url
        });

        // Post to Reddit only if a new song was liked
        console.log('\nPosting liked song to Reddit...');
        const postResult = await RpostPlaylistToReddit(testEmail, 'like', {
          type: 'track',
          name: likeResult.name,
          artist: likeResult.artist,
          url: likeResult.url
        });

        console.log('Reddit post result:', postResult);
      } else {
        console.log('No new liked songs detected');
      }

    } catch (error) {
      console.error('Test failed:', error);
    }
  }, CHECK_INTERVAL);

  // Keep the script running
  console.log('Monitoring for liked songs. Press Ctrl+C to stop.');
}

// Run the test
testSpotifyLikeToReddit();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping Spotify like detection service...');
  process.exit(0);
});