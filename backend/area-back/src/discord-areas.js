const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const session = require("express-session");
require('dotenv').config();
const router = express.Router();
const { getUserIdByEmail, createUserServiceEMAIL, getAccessTokenByEmailAndServiceName, createUserServiceID } = require('./crud_user_services');
const { getServers, getOwnedServers, addServers, addOwnedServersToDB } = require('./crud_discord_queries');
const { getServiceByName } = require('./crud_services');
const fs = require('fs');
const path = require('path');

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

module.exports = {
    storeNewUser
};