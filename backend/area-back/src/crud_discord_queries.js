/**
 * @file discord_queries.js
 * @description Module for performing CRUD operations on Discord related tablesin the database.
 */
const express = require("express");
require('dotenv').config();
const client = require('./db');
const fs = require('fs');
const { getAccessTokenByEmailAndServiceName } = require('./crud_user_services');
const path = require('path');
const { merge } = require("./oauth2-youtube");

async function writeDataToFile(data, filePath) {
  try {
    let existingData = [];

    // Check if the file exists and read existing data
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent) {
        existingData = JSON.parse(fileContent);
      }
    }

    // Merge existing data with new data, avoiding duplicates
    const newData = Array.isArray(data) ? data : [data];
    const mergedData = [...existingData];

    for (const newItem of newData) {
      if (!mergedData.some(item => item.id === newItem.id)) {
        mergedData.push(newItem);
      }
    }

    // Write the merged data back to the file
    fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2));
  } catch (error) {
    console.error('Error writing data to file:', error);
    throw error;
  }
}

async function fetchDataFromFile(filePath = './owned_servers.json') {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${filePath} does not exist. Returning an empty array.`);
      return [];
    }
    const fileData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error fetching data from file:', error);
    throw error;
  }
}

async function getUserGuilds(accessToken) {
  const DISCORD_API_URL = "https://discord.com/api/v10";

  try {
      const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
          headers: {
              Authorization: `Bearer ${accessToken}`,
          },
      });

      if (!response.ok) {
          throw new Error(`Failed to fetch guilds: ${response.statusText}`);
      }
      const guilds = await response.json();
      return guilds;
  } catch (error) {
      console.error("Error fetching user guilds:", error);
      throw error;
  }
}

async function getOwnedUserGuilds(accessToken) {
  const DISCORD_API_URL = "https://discord.com/api/v10";

  try {
      const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
          headers: {
              Authorization: `Bearer ${accessToken}`,
          },
      });

      if (!response.ok) {
          throw new Error(`Failed to fetch guilds: ${response.statusText}`);
      }

      const guilds = await response.json();
      const ownedGuilds = guilds.filter((guild) => guild.owner === true);
      return ownedGuilds;

  } catch (error) {
      console.error("Error fetching user guilds:", error);
      throw error;
  }
}

async function getServers() {
  const query = 'SELECT * FROM DISCORD_servers';
  const res = await client.query(query);
  console.log(res);
  return res.rows;
}

async function getOwnedServers(mail) {
  const query = 'SELECT * FROM DISCORD_servers WHERE owner_email = $1';
  const values = [mail];
  const res = await client.query(query, values);
  console.log("res",res);
  return res.rows[0];
}

async function addServers(guilds, email) {
  try {
      // Assuming your table is named `discord_owned_servers`
      for (const server of guilds) {
        await client.query(
          `INSERT INTO discord_servers (owner_email, server_id, server_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (owner_email, server_id) DO NOTHING`, // Avoid duplicates
          [email, server.id, server.name]
        );
      }

    } catch (dbError) {
      console.error('Error inserting owned servers into database:', dbError);
      throw dbError;
    }
    return 200;
}

async function addOwnedServersToDB(email, accessToken) {
  try {
    // Fetch the user's guilds
    const accessToken = await getAccessTokenByEmailAndServiceName(email, 'Discord');
    const guilds = await getUserGuilds(accessToken);

    // Filter for owned servers
    const ownedServers = guilds.filter(guild => guild.owner);

    // Add owned servers to the database
    try {

      // Assuming your table is named `discord_owned_servers`
      for (const server of ownedServers) {
        await client.query(
          `INSERT INTO discord_servers (owner_email, server_id, server_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (server_id)
           DO NOTHING`, // Avoid duplicates
          [email, server.id, server.name]
        );
      }
      writeDataToFile(ownedServers);

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

async function getUserFriends(accessToken) {
  const DISCORD_API_URL = "https://discord.com/api/v10";

  try {
    const response = await fetch(`${DISCORD_API_URL}/users/@me/relationships`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch friends: ${response.statusText}`);
    }

    const friends = await response.json();

    // Optional: Filter for specific relationship types if needed
    const acceptedFriends = friends.filter((friend) => friend.type === 1); // Type 1 is a confirmed friend

    return acceptedFriends;
  } catch (error) {
    console.error("Error fetching user friends:", error);
    throw error;
  }
}

/**
 * Add a new reaction ID to the reactions_id array for a specific server.
 * @param {string} serverId - The server ID of the row to update.
 * @param {string} reactionId - The reaction ID to add to the reactions_id array.
 * @returns {Promise<void>}
 */
async function addReactionIdToServer(serverId, reactionName) {
  const query = `
    UPDATE discord_servers
    SET reactions_id = array_append(reactions_id, $1)
    WHERE server_id = $2;
  `;

  const reactionQuery = `SELECT id FROM reactions WHERE description = $1;`;

  try {
    const reactionId = await client.query(reactionQuery, [reactionName]);
    await client.query(query, [reactionId, serverId]);
    console.log(`Successfully added reaction ID ${reactionId} to server ${serverId}`);
  } catch (error) {
    console.error('Error updating reactions_id array:', error);
    throw error;
  }
}

async function addReactionIdToMember(username, serverId, reactionName) {
  const query = `UPDATE discord_servers_members
  SET reactions_id = CASE
  WHEN array_position(reactions_id, $1) IS NULL THEN array_append(reactions_id, $1)
  ELSE reactions_id
  END
  WHERE user_name = $2 AND server_id = $3;
  `;

  const actionQuery = `SELECT id FROM actions WHERE description = $1;`;

  try {
    const reactionId = await client.query(actionQuery, [reactionName]);
    await client.query(query, [reactionId, username, serverId]);
    console.log(`Successfully added reaction ID ${reactionId} to user ${username}`);
  } catch (error) {
    console.error('Error updating reactions_id array:', error);
    throw error;
  }
}

/**
 * Fetch all data from discord_servers excluding rows where a specific id is in reactions_id.
 * @param {string} excludedId - The ID to exclude from the results.
 * @returns {Promise<Array>} - The filtered rows from the discord_servers table.
 */
async function fetchFilteredServers(excludedId) {
  const query = `
    SELECT *
    FROM discord_servers
    WHERE reactions_id IS NULL OR NOT $1 = ANY(reactions_id);
  `;

  try {
    const result = await client.query(query, [excludedId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching filtered data:', error);
    throw error;
  }
}

async function fetchFilteredMembers(excludedId) {
  const query = `
    SELECT *
    FROM discord_servers_members
    WHERE reactions_id IS NULL OR NOT $1 = ANY(reactions_id);
  `;

  try {
    const result = await client.query(query, [excludedId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching filtered data:', error);
    throw error;
  }
}

// Export the functions for use in other modules.
module.exports = {
  getServers,
  getOwnedServers,
  addServers,
  addOwnedServersToDB,
  getUserGuilds,
  getUserFriends,
  getOwnedUserGuilds,
  writeDataToFile,
  addReactionIdToServer,
  fetchFilteredServers,
  fetchFilteredMembers,
  addReactionIdToMember
};