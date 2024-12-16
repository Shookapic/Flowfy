const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

async function connectDb() {
  if (!client._connected) {
    await client.connect();
    client._connected = true; // Custom flag to track the connection state
  }
}

async function disconnectDb() {
  if (client._connected) {
    await client.end();
    client._connected = false;
  }
}

module.exports = { client, connectDb, disconnectDb };
