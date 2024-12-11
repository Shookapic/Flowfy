const { google } = require('googleapis');
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

    // Listen for the "like" event
    const response = await youtube.activities.list({
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: 10
    });

    const likedVideos = response.data.items.filter(item => item.snippet.type === 'like');

    for (const video of likedVideos) {
      const videoId = video.contentDetails.like.resourceId.videoId;
      const actionDescription = `User liked video ${videoId}`;

      // Create an action for the "like" event
      await createAction(youtubeService.user_id, 'YouTube', actionDescription);
      console.log(`Action created for liked video: ${videoId}`);

      // Trigger the reaction to subscribe to the channel
      await subscribeToChannel(youtube, videoId);
    }
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

async function RsubscribeToChannel(youtube, videoId) {
  try {
    // Get the channel ID from the video
    const videoResponse = await youtube.videos.list({
      part: 'snippet',
      id: videoId
    });
    const channelId = videoResponse.data.items[0].snippet.channelId;

    // Subscribe to the channel
    await youtube.subscriptions.insert({
      part: 'snippet',
      resource: {
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId: channelId
          }
        }
      }
    });

    console.log(`Subscribed to channel: ${channelId}`);
  } catch (error) {
    console.error('Error subscribing to channel:', error);
  }
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