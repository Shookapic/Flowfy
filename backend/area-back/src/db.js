/**
 * @file db.js
 * @description Module for managing the PostgreSQL database connection.
 */

const { Client } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL client instance.
 * @type {Client}
 */
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

/**
 * Connects to the PostgreSQL database.
 * @async
 * @function connectDb
 * @returns {Promise<void>} A promise that resolves when the connection is established.
 */
async function connectDb() {
  if (!client._connected) {
    await client.connect();
    client._connected = true; // Custom flag to track the connection state
  }
}

/**
 * Disconnects from the PostgreSQL database.
 * @async
 * @function disconnectDb
 * @returns {Promise<void>} A promise that resolves when the connection is closed.
 */
async function disconnectDb() {
  if (client._connected) {
    await client.end();
    client._connected = false;
  }
}

module.exports = { client, connectDb, disconnectDb };