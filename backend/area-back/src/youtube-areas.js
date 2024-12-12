const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { getUserServicesByUserMail } = require('./crud_user_services');
const { createAction } = require('./crud_actions');
const { createReaction } = require('./crud_reactions');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/youtube/callback'
);

async function AonLike(email) {
  try {
    // Retrieve the user's YouTube service credentials
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    // Find the YouTube service
    const youtubeService = userServices.find(service => service.service_id === 2);
    if (!youtubeService) {
      throw new Error('YouTube service not connected');
    }

    // Set the credentials for the OAuth2 client
    oauth2Client.setCredentials({
      access_token: youtubeService.access_token,
      refresh_token: youtubeService.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Retrieve the liked videos playlist ID
    const channelResponse = await youtube.channels.list({
      part: 'contentDetails',
      mine: true
    });

    const channel = channelResponse.data.items[0];
    if (!channel || !channel.contentDetails || !channel.contentDetails.relatedPlaylists.likes) {
      throw new Error('Failed to retrieve liked videos playlist ID');
    }

    const likesPlaylistId = channel.contentDetails.relatedPlaylists.likes;

    console.log('Likes Playlist ID:', likesPlaylistId);

    // Fetch recent activities
    const response = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId: likesPlaylistId,
      maxResults: 10
    });

    console.log('Recent activities:', response.data.items);
  
    // Filter activities to find "like" actions
    const likedVideos = response.data.items.map(item => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      channelId: item.snippet.videoOwnerChannelId
    }));

    console.log('Liked videos:', likedVideos);

    if (likedVideos.length === 0) {
      console.log('No liked videos found.');
      return;
    }

    // Prepare data for writing to the file
    const likeData = likedVideos.map(video => {
      return `Video ID: ${video.videoId}, Title: ${video.title}, Channel ID: ${video.channelId}`;
    }).join('\n');

    console.log('Like data:', likeData);
  
    // Write the data to "recent_likes.txt"
    const filePath = path.join(__dirname, 'recent_likes.txt');
    fs.writeFileSync(filePath, likeData);

    console.log(`Recent likes saved to ${filePath}`);
  } catch (error) {
    console.error('Error handling on like event:', error);
  }
}

async function AonDislike(email) {
    try {
        // Retrieve the user's YouTube service credentials
        const userServices = await getUserServicesByUserMail(email);
        const youtubeService = userServices.find(service => service.service_id === 'YouTube');
        if (!youtubeService) {
        throw new Error('YouTube service not connected');
        }
    
        // Set the credentials for the OAuth2 client
        oauth2Client.setCredentials({
        access_token: youtubeService.access_token,
        refresh_token: youtubeService.refresh_token
        });
    
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
        // Listen for the "dislike" event
        const response = await youtube.activities.list({
        part: 'snippet,contentDetails',
        mine: true,
        maxResults: 10
        });
    
        const dislikedVideos = response.data.items.filter(item => item.snippet.type === 'dislike');
    
        for (const video of dislikedVideos) {
        const videoId = video.contentDetails.like.resourceId.videoId;
        const actionDescription = `User disliked video ${videoId}`;
    
        // Create an action for the "dislike" event
        await createAction(youtubeService.user_id, 'YouTube', actionDescription);
        console.log(`Action created for disliked video: ${videoId}`);
        }
    } catch (error) {
        console.error('Error handling on dislike event:', error);
    }
}

const readline = require('readline');

async function RsubscribeToChannel(email) {
  try {
    // Fetch the user's services to get the YouTube tokens
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    const youtubeService = userServices.find(service => service.service_id === 2);
    if (!youtubeService) {
      throw new Error('YouTube service not connected');
    }

    // Set the credentials for the OAuth2 client
    oauth2Client.setCredentials({
      access_token: youtubeService.access_token,
      refresh_token: youtubeService.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Read the recent likes file and get all Channel IDs
    const channelIds = await readChannelIdsFromFile('./src/recent_likes.txt');
    console.log('Channel IDs:', channelIds);

    // Subscribe to each channel
    for (const channelId of channelIds) {
      try {
        await youtube.subscriptions.insert({
          part: 'snippet',
          resource: {
            snippet: {
              resourceId: {
                kind: 'youtube#channel',
                channelId
              }
            }
          }
        });
        console.log(`Subscribed to channel: ${channelId}`);
      } catch (error) {
        if (error.errors && error.errors[0].reason === 'subscriptionDuplicate') {
          console.log(`Already subscribed to channel: ${channelId}`);
        } else {
          console.error(`Error subscribing to channel: ${channelId}`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error subscribing to channels:', error);
  }
}

// Function to read Channel IDs from file
async function readChannelIdsFromFile(filePath) {
  const channelIds = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const match = line.match(/Channel ID: ([A-Za-z0-9-_]+)/);
    if (match) {
      channelIds.push(match[1]);
    }
  }

  return channelIds;
}



async function RunsubscribeFromChannel(youtube, videoId) {
    try {
        // Get the channel ID from the video
        const videoResponse = await youtube.videos.list({
            part: 'snippet',
            id: videoId
        });
        const channelId = videoResponse.data.items[0].snippet.channelId;
    
        // Unsubscribe from the channel
        await youtube.subscriptions.delete({
            id: channelId
        });
    
        console.log(`Unsubscribed from channel: ${channelId}`);
    } catch (error) {
        console.error('Error unsubscribing from channel:', error);
    }
}

module.exports = { AonLike, AonDislike, RsubscribeToChannel, RunsubscribeFromChannel};