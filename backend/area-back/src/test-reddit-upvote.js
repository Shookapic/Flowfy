const { OnSubJoin, RcreatePlaylistFromUpvote } = require('./reddit-areas');

async function testRedditSubToSpotify() {
    const testEmail = 'mazeauarthur7@gmail.com'; // Replace with your test email
    const CHECK_INTERVAL = 6000; // 6 seconds interval

    console.log('Starting Reddit subreddit join detection service...');
    console.log('Waiting for new subreddit joins...');

    // Run the check periodically
    setInterval(async () => {
        try {
            console.log('\nChecking for new subreddit joins...');
            const subResult = await OnSubJoin(testEmail);

            if (subResult) {
                console.log('New subreddit join detected:', {
                    name: subResult.name,
                    title: subResult.title,
                    url: subResult.url
                });

                // Create Spotify playlist when new subreddit is joined
                console.log('\nCreating Spotify playlist...');
                const playlistResult = await RcreatePlaylistFromUpvote(testEmail, subResult);
                console.log('Playlist creation result:', playlistResult);
            } else {
                console.log('No new subreddit joins detected');
            }
        } catch (error) {
            console.error('Test failed:', error);
        }
    }, CHECK_INTERVAL);

    // Keep the script running
    console.log('Monitoring for subreddit joins. Press Ctrl+C to stop.');
}

// Run the test
testRedditSubToSpotify();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nStopping Reddit subreddit join detection service...');
    process.exit(0);
});