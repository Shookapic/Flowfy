const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const session = require("express-session");
require('dotenv').config();
const router = express.Router();
const { getAccessTokenByEmailAndServiceName } = require('./crud_user_services');
const { writeDataToFile, getUserGuilds } = require('./crud_discord_queries');
const { getServiceByName } = require('./crud_services');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { Client, Events, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Required for guildMemberAdd
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required for reading message content
  ],
});
const axios = require('axios');
const botToken = process.env.DISCORD_BOT_TOKEN;
function findNewOwnedServers(currentGuilds, previousGuilds) {
  const previousGuildIds = new Set(previousGuilds.map(guild => guild.id));
  return currentGuilds.filter(guild => !previousGuildIds.has(guild.id) && guild.owner);
}

const storeNewUser = async (member, guildInfo) => {
  console.log("in store new user");
  const { guildName, guildId } = guildInfo;
  const userInfo = {
    discordId: member.user.id,
    username: member.user.username,
    discriminator: member.user.discriminator,
    joinedAt: new Date().toISOString(),
    guildName,
    guildId,
  };

  const filePath = path.join(__dirname, 'DISCORD_new_users.json');

  try {
    // Check if the file exists, else create it
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }

    // Read the existing data
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    fileData.push(userInfo);

    // Write back to the file
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

    console.log(`Stored new user info: ${userInfo.username}#${userInfo.discriminator}`);
  } catch (error) {
    console.error('Error storing user info:', error);
  }
};

async function AonServerCreation(email) {
  try {
    console.log('in AonServerCreation');
    // Fetch the user's guilds
    const accessToken = await getAccessTokenByEmailAndServiceName(email, 'Discord');
    const guilds = await getUserGuilds(accessToken);

    // Filter for owned servers
    const ownedServers = guilds.filter(guild => guild.owner);
    if (ownedServers.length === 0) {
      console.log('No owned servers found for email:', email);
      return null;
    }
    ownedServers.forEach(server => {
      server.owner_email = email; // Add email to each server object
    });

    // Add owned servers to the database
    try {

      // Assuming your table is named `discord_owned_servers`
      for (const server of ownedServers) {
        await db.query(
          `INSERT INTO discord_servers (owner_email, server_id, server_name)
               VALUES ($1, $2, $3)
               ON CONFLICT (server_id)
               DO NOTHING`, // Avoid duplicates
          [email, server.id, server.name]
        );
      }
      writeDataToFile(ownedServers, './DISCORD_owned_servers.json');
      console.log('added servers to db return email', email);
    } catch (dbError) {
      console.error('Error inserting owned servers into database:', dbError);
      console.log('Error inserting owned servers into database:', dbError);
      return null;
      throw dbError;
    }
    console.log('return email', email);
  } catch (error) {
    console.error('Error adding owned servers:', error);
    console.log('Error adding owned servers:', error);
    throw error;
  }
  return email;
}

async function AonNewServerMember(email) {
  try {
    console.log('Checking for new server members for email:', email);

    // Fetch the user's guilds
    const accessToken = await getAccessTokenByEmailAndServiceName(email, 'Discord');
    const guilds = await getUserGuilds(accessToken);

    // Filter for owned servers
    const ownedServers = guilds.filter(guild => guild.owner);
    if (ownedServers.length === 0) {
      console.log('No owned servers found for email:', email);
      return null;
    }
    for (const server of ownedServers) {
      console.log(`Fetching members for guild: ${server.name} (ID: ${server.id})`);

      // Fetch members of the guild
      const members = await fetchGuildMembers(server.id, botToken);

      // Fetch recorded members from the database
      const recordedMembers = await db.query(
        `SELECT user_id FROM discord_servers_members WHERE server_id = $1`,
        [server.id]
      );
      const recordedMemberIds = recordedMembers.rows.map(row => row.user_id);

      if (recordedMemberIds.length === 0) {
        console.log('No recorded members found for server:', server.name);
        // Insert all fetched members into the database
        for (const member of members) {
          const userInfo = {
            discordId: member.user.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
            joinedAt: new Date().toISOString(),
            guildName: server.name,
            guildId: server.id,
          };

          try {
            // Save new member to database
            await db.query(
              `INSERT INTO discord_servers_members (server_id, server_name, user_name, user_id, joined_at)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (server_id, user_name) DO NOTHING;`,
              [server.id, server.name, userInfo.username, userInfo.discordId, userInfo.joinedAt]
            );

            // Optionally save new member data to a file
            await writeDataToFile(userInfo, './DISCORD_new_server_members.json');
            console.log('Added new member to database:', userInfo.username);
          } catch (dbError) {
            console.error('Error inserting new member into database:', dbError);
            throw dbError;
          }
        }
        continue;
      }

      // Find new members by comparing recorded IDs
      const newMembers = members.filter(member => !recordedMemberIds.includes(member.user.id));
      if (newMembers.length === 0) {
        console.log('No new members found for server:', server.name);
        continue;
      }
      for (const newMember of newMembers) {
        const userInfo = {
          discordId: newMember.user.id,
          username: newMember.user.username,
          discriminator: newMember.user.discriminator,
          joinedAt: new Date().toISOString(),
          guildName: server.name,
          guildId: server.id,
        };

        try {
          // Save new member to database
          await db.query(
            `INSERT INTO discord_servers_members (server_id, server_name, user_name, user_id, joined_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (server_id, user_name) DO NOTHING;`,
            [server.id, server.name, userInfo.username, userInfo.discordId, userInfo.joinedAt]
          );

          // Optionally save new member data to a file
          await writeDataToFile(userInfo, './DISCORD_new_server_members.json');
          console.log('Added new member to database:', userInfo.username);
        } catch (dbError) {
          console.error('Error inserting new member into database:', dbError);
          throw dbError;
        }
      }
    }

    console.log('Finished checking for new server members for email:', email);
  } catch (error) {
    console.error('Error detecting new server members:', error);
    throw error;
  }
  return "done";
}
/**
 * Fetches members for a specific guild using the Discord API.
 * Replace this with the appropriate API call for your Discord bot or integration.
 */
async function fetchGuildMembers(guildId, botToken) {
  const url = `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bot ${botToken}`, // Use bot token here
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch members for guild ${guildId}. Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching members for guild ${guildId}:`, error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  storeNewUser,
  AonServerCreation,
  AonNewServerMember,
  client
};
