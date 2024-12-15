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

async function AonSubscribe(email) {
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

    // Fetch the list of subscriptions
    const response = await youtube.subscriptions.list({
      part: 'snippet',
      mine: true,
      maxResults: 10,
      order: 'relevance' // Order by date to get the most recent subscriptions first
    });

    console.log('Subscribed channels:', response.data.items);

    // Extract details of the last 10 subscribed channels
    const subscribedChannels = response.data.items.map(item => ({
      channelId: item.snippet.resourceId.channelId,
      title: item.snippet.title,
    }));

    console.log('Subscribed channels:', subscribedChannels);

    // Prepare data for writing to the file
    const subscribedChannelData = subscribedChannels.map(channel => {
      return `Channel ID: ${channel.channelId}, Title: ${channel.title}`;
    }).join('\n');

    console.log('Subscribed channel data:', subscribedChannelData);

    // Write the data to "subscribed_channels.txt"
    const filePath = path.join(__dirname, 'subscribed_channels.txt');
    fs.writeFileSync(filePath, subscribedChannelData);

    console.log(`Subscribed channels saved to ${filePath}`);
  } catch (error) {
    console.error('Error handling subscription event:', error);
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

async function RunsubscribeFromChannel(email) {
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

    // Read the recent dislikes file and get all Channel IDs
    const channelIds = await readChannelIdsFromFile('./src/recent_dislikes.txt');
    console.log('Channel IDs to unsubscribe from:', channelIds);

    // Unsubscribe from each channel
    for (const channelId of channelIds) {
      try {
        // Retrieve the subscription ID for the given channel
        const subscriptions = await youtube.subscriptions.list({
          part: 'id',
          forChannelId: channelId,
          mine: true
        });

        if (subscriptions.data.items.length === 0) {
          console.log(`Not subscribed to channel: ${channelId}`);
          continue;
        }

        const subscriptionId = subscriptions.data.items[0].id;

        // Delete the subscription
        await youtube.subscriptions.delete({
          id: subscriptionId
        });

        console.log(`Unsubscribed from channel: ${channelId}`);
      } catch (error) {
        console.error(`Error unsubscribing from channel: ${channelId}`, error);
      }
    }
  } catch (error) {
    console.error('Error unsubscribing from channels:', error);
  }
}

async function Rlike3latestvideo(email) {
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
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: youtubeService.access_token,
      refresh_token: youtubeService.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Read the subscribed channels from the file
    const filePath = path.join(__dirname, 'subscribed_channels.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    // Process each line to get channel details
    const subscribedChannels = lines.map(line => {
      const parts = line.split(', ');
      const channelId = parts[0].split(': ')[1]?.trim();  // Handle the possible undefined error
      const title = parts[1].split(': ')[1]?.trim();    // Handle the possible undefined error

      if (channelId && title) {
        return { channelId, title};
      }
      return null; // Return null if the data is incomplete
    }).filter(channel => channel !== null); // Remove any invalid entries

    // Iterate over each channel to get their latest 3 videos
    for (let channel of subscribedChannels) {
      console.log(`Processing Channel: ${channel.title} (ID: ${channel.channelId})`);

      // Get the latest videos
      const videoResponse = await youtube.search.list({
        part: 'snippet',
        channelId: channel.channelId,
        maxResults: 3,
        order: 'date' // Order by most recent
      });

      const videos = videoResponse.data.items;
      if (videos.length === 0) {
        console.log(`No videos found for channel: ${channel.title}`);
        continue;
      }

      console.log(`Liking the 3 latest videos from ${channel.title}`);

      for (let video of videos) {
        await youtube.videos.rate({
          id: video.id.videoId,
          rating: 'like'
        });
        console.log(`Liked video ID: ${video.id.videoId}`);
      }
    }
  } catch (error) {
    console.error('Error handling like event for latest videos:', error);
  }
}

module.exports = { AonLike, AonComment, RsubscribeToChannel, RunsubscribeFromChannel, Rlike3latestvideo };