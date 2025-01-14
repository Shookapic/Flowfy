const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const session = require("express-session");
require('dotenv').config();
const router = express.Router();
const { getUserIdByEmail, createUserServiceEMAIL, getAccessTokenByEmailAndServiceName, createUserServiceID } = require('./crud_user_services');
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
    // Fetch the user's guilds
    const accessToken = await getAccessTokenByEmailAndServiceName(email, 'Discord');
    const guilds = await getUserGuilds(accessToken);

    // Filter for owned servers
    const ownedServers = guilds.filter(guild => guild.owner);

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

    } catch (dbError) {
      console.error('Error inserting owned servers into database:', dbError);
      throw dbError;
    }
    return ownedServers;
  } catch (error) {
    console.error('Error adding owned servers:', error);
    throw error;
  }
}

async function AonNewServerMember(email) {
  client.on('guildMemberAdd', async (member) => {
    const guildName = member.guild.name; // Get the name of the guild
    const guildId = member.guild.id; // Get the ID of the guild
    const userTag = `${member.user.username}#${member.user.discriminator}`; // Get the user's tag

    console.log(`New member joined: ${userTag}`);
    console.log(`Joined Server: ${guildName} (ID: ${guildId})`);
    const userInfo = {
      discordId: member.user.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
      joinedAt: new Date().toISOString(),
      guildName,
      guildId,
    };

    userInfo.server_name = guildName;
    userInfo.server_id = guildId;
    console.log('userinfo', userInfo);
    console.log('userTag', userTag);
    console.log('guildId', guildId);
    console.log('guildName', guildName);
    // Pass member and guild info to the storeNewUser function
    try {

      await writeDataToFile(userInfo, './DISCORD_new_server_members.json');
      await db.query(
        `INSERT INTO discord_servers_members (server_id, server_name, user_name, user_id, joined_at)
      VALUES ($1, $2, $3, $4, $5)`,
        [guildId, guildName, userInfo.username, userInfo.discordId, userInfo.joinedAt]
      );

    } catch (dbError) {
      console.error('Error inserting owned servers into database:', dbError);
      throw dbError;
    }
    return userInfo;
  });
}

module.exports = {
  storeNewUser,
  AonServerCreation,
  AonNewServerMember,
  client
};
