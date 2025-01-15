/**
 * @file youtube-areas.js
 * @description Module for handling YouTube actions and reactions using OAuth2 authentication.
 */

const { google } = require('googleapis');
const { discord } = require('./oauth2-discord');
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

/**
 * Handles the YouTube like action.
 * @async
 * @function AonLike
 * @param {string} email - The email address of the user.
 */
async function AonLike(email) {
  try {
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    const youtubeService = userServices.find(service => service.service_id === 2);
    if (!youtubeService) {
      throw new Error('YouTube service not connected');
    }

    oauth2Client.setCredentials({
      access_token: youtubeService.access_token,
      refresh_token: youtubeService.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

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

    const response = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId: likesPlaylistId,
      maxResults: 10
    });

    console.log('Recent activities:', response.data.items);
  
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

    const likeData = likedVideos.map(video => {
      return `Video ID: ${video.videoId}, Title: ${video.title}, Channel ID: ${video.channelId}`;
    }).join('\n');

    console.log('Like data:', likeData);
  
    const filePath = path.join(__dirname, 'recent_likes.txt');
    fs.writeFileSync(filePath, likeData);

    console.log(`Recent likes saved to ${filePath}`);
  } catch (error) {
    console.error('Error handling on like event:', error);
  }
}

/**
 * Handles the YouTube subscription action.
 * @async
 * @function AonSubscribe
 * @param {string} email - The email address of the user.
 */
async function AonSubscribe(email) {
  try {
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    const youtubeService = userServices.find(service => service.service_id === 2);
    if (!youtubeService) {
      throw new Error('YouTube service not connected');
    }

    oauth2Client.setCredentials({
      access_token: youtubeService.access_token,
      refresh_token: youtubeService.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.subscriptions.list({
      part: 'snippet',
      mine: true,
      maxResults: 10,
      order: 'relevance'
    });

    console.log('Subscribed channels:', response.data.items);

    const subscribedChannels = response.data.items.map(item => ({
      channelId: item.snippet.resourceId.channelId,
      title: item.snippet.title,
    }));

    console.log('Subscribed channels:', subscribedChannels);

    const subscribedChannelData = subscribedChannels.map(channel => {
      return `Channel ID: ${channel.channelId}, Title: ${channel.title}`;
    }).join('\n');

    console.log('Subscribed channel data:', subscribedChannelData);

    const filePath = path.join(__dirname, 'subscribed_channels.txt');
    fs.writeFileSync(filePath, subscribedChannelData);

    console.log(`Subscribed channels saved to ${filePath}`);
  } catch (error) {
    console.error('Error handling subscription event:', error);
  }
}

const readline = require('readline');

/**
 * Subscribes to channels listed in the recent likes file.
 * @async
 * @function RsubscribeToChannel
 * @param {string} email - The email address of the user.
 */
async function RsubscribeToChannel(email) {
  try {
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    const youtubeService = userServices.find(service => service.service_id === 2);
    if (!youtubeService) {
      throw new Error('YouTube service not connected');
    }

    oauth2Client.setCredentials({
      access_token: youtubeService.access_token,
      refresh_token: youtubeService.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const channelIds = await readChannelIdsFromFile('./src/recent_likes.txt');
    console.log('Channel IDs:', channelIds);

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

/**
 * Reads channel IDs from a file.
 * @async
 * @function readChannelIdsFromFile
 * @param {string} filePath - The path to the file containing channel IDs.
 * @returns {Promise<Array<string>>} A promise that resolves with an array of channel IDs.
 */
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

/**
 * Unsubscribes from channels listed in the recent dislikes file.
 * @async
 * @function RunsubscribeFromChannel
 * @param {string} email - The email address of the user.
 */
async function RunsubscribeFromChannel(email) {
  try {
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    const youtubeService = userServices.find(service => service.service_id === 2);
    if (!youtubeService) {
      throw new Error('YouTube service not connected');
    }

    oauth2Client.setCredentials({
      access_token: youtubeService.access_token,
      refresh_token: youtubeService.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const channelIds = await readChannelIdsFromFile('./src/recent_dislikes.txt');
    console.log('Channel IDs to unsubscribe from:', channelIds);

    for (const channelId of channelIds) {
      try {
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

/**
 * Likes the 3 latest videos from subscribed channels.
 * @async
 * @function Rlike3latestvideo
 * @param {string} email - The email address of the user.
 */
async function Rlike3latestvideo(email) {
  try {
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    const youtubeService = userServices.find(service => service.service_id === 2);
    if (!youtubeService) {
      throw new Error('YouTube service not connected');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: youtubeService.access_token,
      refresh_token: youtubeService.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const filePath = path.join(__dirname, 'subscribed_channels.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    const subscribedChannels = lines.map(line => {
      const parts = line.split(', ');
      const channelId = parts[0].split(': ')[1]?.trim();
      const title = parts[1].split(': ')[1]?.trim();

      if (channelId && title) {
        return { channelId, title };
      }
      return null;
    }).filter(channel => channel !== null);

    for (let channel of subscribedChannels) {
      console.log(`Processing Channel: ${channel.title} (ID: ${channel.channelId})`);

      const videoResponse = await youtube.search.list({
        part: 'snippet',
        channelId: channel.channelId,
        maxResults: 3,
        order: 'date'
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

async function AonNewVideo(email) {
  try {
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    const youtubeService = userServices.find(service => service.service_id === 2);
    if (!youtubeService) {
      throw new Error('YouTube service not connected');
    }

    oauth2Client.setCredentials({
      access_token: youtubeService.access_token,
      refresh_token: youtubeService.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.activities.list({
      part: 'snippet',
      mine: true,
      maxResults: 10
    });

    console.log('Recent activities:', response.data.items);

    const newVideos = response.data.items.filter(item => item.snippet.type === 'upload').map(item => ({
      videoId: item.snippet.contentDetails.upload.videoId,
      title: item.snippet.title,
      channelId: item.snippet.channelId
    }));

    console.log('New videos:', newVideos);

    if (newVideos.length === 0) {
      console.log('No new videos found.');
      return;
    }

    const videoData = newVideos.map(video => {
      return `Video ID: ${video.videoId}, Title: ${video.title}, Channel ID: ${video.channelId}`;
    }).join('\n');

    console.log('New video data:', videoData);

    const filePath = path.join(__dirname, 'new_videos.txt');
    fs.writeFileSync(filePath, videoData);

    console.log(`New videos saved to ${filePath}`);
  } catch (error) {
    console.error('Error handling new video event:', error);
  }
}

async function RaddSongToSpotify(email) {
  try {
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    const spotifyService = userServices.find(service => service.service_id === 1);
    if (!spotifyService) {
      throw new Error('Spotify service not connected');
    }

    oauth2Client.setCredentials({
      access_token: spotifyService.access_token,
      refresh_token: spotifyService.refresh_token
    });

    const spotify = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await spotify.playlistItems.list({
      part: 'snippet',
      playlistId: 'PL4fGSI1pDJn5Jf3gj9u3k7n8f4f3OwLzB',
      maxResults: 10
    });

    console.log('Recent activities:', response.data.items);

    const songs = response.data.items.map(item => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      channelId: item.snippet.videoOwnerChannelId
    }));

    console.log('Songs:', songs);

    if (songs.length === 0) {
      console.log('No songs found.');
      return;
    }

    const songData = songs.map(song => {
      return `Song ID: ${song.videoId}, Title: ${song.title}, Channel ID: ${song.channelId}`;
    }).join('\n');

    console.log('Song data:', songData);

    const filePath = path.join(__dirname, 'recent_songs.txt');
    fs.writeFileSync(filePath, songData);

    console.log(`Recent songs saved to ${filePath}`);
  } catch (error) {
    console.error('Error handling add song to Spotify event:', error);
  }
}

async function RrecommendchannelDiscord(email) {
  try {
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }

    const discordService = userServices.find(service => service.service_id === 3);
    if (!discordService) {
      throw new Error('Discord service not connected');
    }

    oauth2Client.setCredentials({
      access_token: discordService.access_token,
      refresh_token: discordService.refresh_token
    });

    const discord = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await discord.channels.list({
      part: 'snippet',
      mine: true,
      maxResults: 10
    });

    console.log('Recent activities:', response.data.items);

    const channels = response.data.items.map(item => ({
      channelId: item.snippet.resourceId.channelId,
      title: item.snippet.title,
    }));

    console.log('Channels:', channels);

    if (channels.length === 0) {
      console.log('No channels found.');
      return;
    }

    const channelData = channels.map(channel => {
      return `Channel ID: ${channel.channelId}, Title: ${channel.title}`;
    }).join('\n');

    console.log('Channel data:', channelData);

    const filePath = path.join(__dirname, 'recent_channels.txt');
    fs.writeFileSync(filePath, channelData);

    console.log(`Recent channels saved to ${filePath}`);
  } catch (error) {
    console.error('Error handling recommend channel event:', error);
  }
}
module.exports = { AonLike, AonSubscribe, AonNewVideo, RsubscribeToChannel, RunsubscribeFromChannel, Rlike3latestvideo, RaddSongToSpotify, RrecommendchannelDiscord };