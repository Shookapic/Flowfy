const { OnUpvote, RcreatePlaylistFromUpvote } = require('./reddit-areas');

async function testRedditUpvoteToSpotify() {
  const testEmail = 'mazeauarthur7@gmail.com';
  const CHECK_INTERVAL = 60000; // 60 seconds = 1 minute

  console.log('Starting Reddit upvote detection service...');
  console.log('Waiting for new upvoted posts...');

  // Run the check every minute
  setInterval(async () => {
    try {
      console.log('\nChecking for new upvoted posts...');
      const upvoteResult = await OnUpvote(testEmail);
      
      if (upvoteResult) {
        console.log('New upvoted post detected:', {
          title: upvoteResult.title,
          id: upvoteResult.id
        });

        // Create Spotify playlist only if a new upvote is detected
        console.log('\nCreating Spotify playlist...');
        const playlistResult = await RcreatePlaylistFromUpvote(testEmail, upvoteResult);
        console.log('Playlist creation result:', playlistResult);
      } else {
        console.log('No new upvoted posts detected');
      }

    } catch (error) {
      console.error('Test failed:', error);
    }
  }, CHECK_INTERVAL);

  // Keep the script running
  console.log('Monitoring for upvoted posts. Press Ctrl+C to stop.');
}

// Run the test
testRedditUpvoteToSpotify();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping Reddit upvote detection service...');
  process.exit(0);
});