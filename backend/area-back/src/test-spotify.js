const { OnPlaylistCreation, RpostPlaylistToReddit } = require('./spotify-areas');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testSpotifyReddit() {
  const testEmail = 'mazeauarthur7@gmail.com';

  try {
    console.log('Testing OnPlaylistCreation...');
    const playlistResult = await OnPlaylistCreation(testEmail);
    console.log('Playlist detection result:', playlistResult);

    if (playlistResult) {
      console.log('\nTesting RpostPlaylistToReddit...');
      const result = await RpostPlaylistToReddit(testEmail);
      
      if (result.requiresAuth) {
        console.log(`Reddit authentication required. Please visit: ${result.redirectUrl}`);
        
        await new Promise((resolve) => {
          rl.question('Press Enter after completing Reddit authentication...', () => {
            resolve();
          });
        });
        
        console.log('Retrying Reddit post...');
        const retryResult = await RpostPlaylistToReddit(testEmail);
        
        if (retryResult.status === 'success') {
          console.log('Posted to Reddit:', retryResult);
        } else {
          console.error('Error:', retryResult.message);
        }
      } else if (result.status === 'success') {
        console.log('Posted to Reddit:', result);
      } else {
        console.error('Error:', result.message);
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    rl.close();
  }
}

testSpotifyReddit();