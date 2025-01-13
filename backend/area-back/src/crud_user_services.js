const client = require('./db');

/**
 * Creates or updates a user_service in the database.
 *
 * @param {number} userId - The ID of the user.
 * @param {number} serviceId - The ID of the service.
 * @param {string} accessToken - The access token for the service.
 * @param {string} refreshToken - The refresh token for the service.
 * @param {boolean} isLogged - The logged status of the user for the service.
 * @returns {Promise<void>} - A promise that resolves when the user_service is created or updated.
 */
async function createUserServiceID(userId, serviceId, accessToken, refreshToken, isLogged) {
    try {
        // Check if the user_service entry already exists
        const checkQuery = 'SELECT * FROM user_services WHERE user_id = $1 AND service_id = $2';
        const checkValues = [userId, serviceId];
        const checkRes = await client.query(checkQuery, checkValues);

        if (checkRes.rows.length > 0) {
            // Update the existing user_service entry
            const updateQuery = 'UPDATE user_services SET access_token = $1, refresh_token = $2, is_logged = $3 WHERE user_id = $4 AND service_id = $5 RETURNING *';
            const updateValues = [accessToken, refreshToken, isLogged, userId, serviceId];
            const updateRes = await client.query(updateQuery, updateValues);
            console.log('User Service Updated:', updateRes.rows[0]);
        } else {
            // Create a new user_service entry
            const insertQuery = 'INSERT INTO user_services(user_id, service_id, access_token, refresh_token, is_logged) VALUES($1, $2, $3, $4, $5) RETURNING *';
            const insertValues = [userId, serviceId, accessToken, refreshToken, isLogged];
            const insertRes = await client.query(insertQuery, insertValues);
            console.log('User Service Created:', insertRes.rows[0]);
        }
    } catch (error) {
        console.error('Error creating or updating user service:', error);
    }
}

/**
 * Creates a new user_service in the database.
 *
 * @param {string} userMail - The email of the user.
 * @param {number} serviceId - The ID of the service.
 * @param {string} accessToken - The access token for the service.
 * @param {string} refreshToken - The refresh token for the service.
 * @param {boolean} isLogged - The logged status of the user for the service.
 * @returns {Promise<void>} - A promise that resolves when the user_service is created.
 */
async function createUserServiceEMAIL(userMail, serviceId, accessToken, refreshToken, isLogged) {
    try {
        // Fetch the user ID based on the email
        const userQuery = 'SELECT id FROM users WHERE email = $1';
        const userValues = [userMail];
        const userRes = await client.query(userQuery, userValues);

        if (userRes.rows.length === 0) {
            throw new Error('User not found');
        }

        const userId = userRes.rows[0].id;

        // Log the information before inserting
        console.log('Creating User Service with the following details:');
        console.log('User ID:', userId);
        console.log('Service ID:', serviceId);
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        console.log('Is Logged:', isLogged);

        // Create the user_service entry
        const query = 'INSERT INTO user_services(user_id, service_id, access_token, refresh_token, is_logged) VALUES($1, $2, $3, $4, $5) RETURNING *';
        const values = [userId, serviceId, accessToken, refreshToken, isLogged];
        const res = await client.query(query, values);
        console.log('User Service Created:', res.rows[0]);
    } catch (error) {
        console.error('Error creating user service:', error);
    }
}

/**
 * Fetches all user_services from the database.
 *
 * @returns {Promise<void>} - A promise that resolves when the user_services have been fetched and logged.
 */
async function getUserServices() {
    const query = 'SELECT * FROM user_services';
    const res = await client.query(query);
    console.log('User Services:', res.rows);
}

/**
 * Fetches user_services by user_id from the database.
 *
 * @param {number} userId - The ID of the user.
 * @returns {Promise<void>} - A promise that resolves when the user_services have been fetched and logged.
 */
async function getUserServicesByUserId(userId) {
    const query = 'SELECT * FROM user_services WHERE user_id = $1';
    const values = [userId];
    const res = await client.query(query, values);
    console.log('User Services for User ID:', userId, res.rows);
}

/**
 * Fetches user_services by user_mail from the database.
 *
 * @param {string} userMail - The email of the user.
 * @returns {Promise<void>} - A promise that resolves when the user_services have been fetched and logged.
 */
async function getUserServicesByUserMail(userMail) {
    try {
        // Fetch the user ID based on the email
        const userQuery = 'SELECT id FROM users WHERE email = $1';
        const userValues = [userMail];
        const userRes = await client.query(userQuery, userValues);

        if (userRes.rows.length === 0) {
            throw new Error('User not found');
        }

        const userId = userRes.rows[0].id;

        // Fetch the user_services entries
        const query = 'SELECT * FROM user_services WHERE user_id = $1';
        const values = [userId];
        const res = await client.query(query, values);
        console.log('User Services for User ID:', userId, res.rows);
        return res.rows;
    } catch (error) {
        console.error('Error fetching user services:', error);
    }
}

/**
 * Fetches user_services by service_id from the database.
 *
 * @param {number} serviceId - The ID of the service.
 * @returns {Promise<void>} - A promise that resolves when the user_services have been fetched and logged.
 */
async function getUserServicesByServiceId(serviceId) {
    const query = 'SELECT * FROM user_services WHERE service_id = $1';
    const values = [serviceId];
    const res = await client.query(query, values);
    console.log('User Services for Service ID:', serviceId, res.rows);
}

/**
 * Updates the access token for a user_service in the database.
 *
 * @param {number} userId - The ID of the user.
 * @param {number} serviceId - The ID of the service.
 * @param {string} accessToken - The new access token for the service.
 * @param {string} refreshToken - The new refresh token for the service.
 * @returns {Promise<void>} - A promise that resolves when the user_service is updated.
 */
async function updateUserServiceAccessToken(userId, serviceId, accessToken, refreshToken) {
    try {
        // Fetch the user_service entry based on user_id and service_id
        const query = 'SELECT * FROM user_services WHERE user_id = $1 AND service_id = $2';
        const values = [userId, serviceId];
        const res = await client.query(query, values);

        if (res.rows.length === 0) {
            throw new Error('User service not found');
        }

        // Update the access token and refresh token
        const updateQuery = 'UPDATE user_services SET access_token = $1, refresh_token = $2 WHERE user_id = $3 AND service_id = $4 RETURNING *';
        const updateValues = [accessToken, refreshToken, userId, serviceId];
        const updateRes = await client.query(updateQuery, updateValues);
        console.log('User Service Updated:', updateRes.rows[0]);
    } catch (error) {
        console.error('Error updating user service access token:', error);
    }
}

/**
 * Updates the refresh token for a user_service in the database.
 *
 * @param {number} userId - The ID of the user.
 * @param {number} serviceId - The ID of the service.
 * @param {string} refreshToken - The new refresh token for the service.
 * @returns {Promise<void>} - A promise that resolves when the user_service is updated.
 */
async function updateUserServiceRefreshToken(userId, serviceId, refreshToken) {
    try {
        // Fetch the user_service entry based on user_id and service_id
        const query = 'SELECT * FROM user_services WHERE user_id = $1 AND service_id = $2';
        const values = [userId, serviceId];
        const res = await client.query(query, values);

        if (res.rows.length === 0) {
            throw new Error('User service not found');
        }

        // Update the refresh token
        const updateQuery = 'UPDATE user_services SET refresh_token = $1 WHERE user_id = $2 AND service_id = $3 RETURNING *';
        const updateValues = [refreshToken, userId, serviceId];
        const updateRes = await client.query(updateQuery, updateValues);
        console.log('User Service Updated:', updateRes.rows[0]);
    } catch (error) {
        console.error('Error updating user service refresh token:', error);
    }
}

/**
 * Deletes a user_service from the database by its ID.
 *
 * @param {number} id - The ID of the user_service to delete.
 * @returns {Promise<void>} - A promise that resolves when the user_service is deleted.
 */
async function deleteUserService(id) {
    const query = 'DELETE FROM user_services WHERE id = $1 RETURNING *';
    const values = [id];
    const res = await client.query(query, values);
    console.log('User Service Deleted:', res.rows[0]);
}

/**
 * Deletes a user_service from the database by user_id and service_id.
 *
 * @param {number} userId - The ID of the user.
 * @param {number} serviceId - The ID of the service.
 * @returns {Promise<void>} - A promise that resolves when the user_service is deleted.
 */
async function deleteUserServiceByUserIdAndServiceId(userId, serviceId) {
    const query = 'DELETE FROM user_services WHERE user_id = $1 AND service_id = $2 RETURNING *';
    const values = [userId, serviceId];
    const res = await client.query(query, values);
    console.log('User Service Deleted:', res.rows[0]);
}

/**
 * Deletes all user_services from the database by user_id.
 *
 * @param {number} userId - The ID of the user.
 * @returns {Promise<void>} - A promise that resolves when the user_services are deleted.
 */
async function deleteUserServicesByUserId(userId) {
    const query = 'DELETE FROM user_services WHERE user_id = $1 RETURNING *';
    const values = [userId];
    const res = await client.query(query, values);
    console.log('User Services Deleted for User ID:', userId, res.rows);
}

/**
 * Deletes all user_services from the database by service_id.
 *
 * @param {number} serviceId - The ID of the service.
 * @returns {Promise<void>} - A promise that resolves when the user_services are deleted.
 */
async function deleteUserServicesByServiceId(serviceId) {
    const query = 'DELETE FROM user_services WHERE service_id = $1 RETURNING *';
    const values = [serviceId];
    const res = await client.query(query, values);
    console.log('User Services Deleted for Service ID:', serviceId, res.rows);
}

async function getUserIdByEmail(email) {
  const query = 'SELECT id FROM users WHERE email = $1';
  const values = [email];
  const result = await client.query(query, values);
  return result.rows[0]?.id;
}

async function getAccessTokenByEmailAndServiceName(email, serviceName) {
  // Get user_id from users table using email
  const userQuery = 'SELECT id FROM users WHERE email = $1';
  const userValues = [email];
  const userResult = await client.query(userQuery, userValues);
  const userId = userResult.rows[0]?.id;

  if (!userId) {
    throw new Error(`User with email ${email} not found`);
  }

  // Get service_id from services table using serviceName
  const serviceQuery = 'SELECT id FROM services WHERE name = $1';
  const serviceValues = [serviceName];
  const serviceResult = await client.query(serviceQuery, serviceValues);
  const serviceId = serviceResult.rows[0]?.id;

  if (!serviceId) {
    throw new Error(`Service with name ${serviceName} not found`);
  }

  // Get access_token from user_services table using user_id and service_id
  const tokenQuery = 'SELECT access_token FROM user_services WHERE user_id = $1 AND service_id = $2';
  const tokenValues = [userId, serviceId];
  const tokenResult = await client.query(tokenQuery, tokenValues);
  const accessToken = tokenResult.rows[0]?.access_token;

  if (!accessToken) {
    throw new Error(`Access token for user_id ${userId} and service_id ${serviceId} not found`);
  }

  return accessToken;
}

async function storeTokens(userId, accessToken, refreshToken) {
  const query = `
    UPDATE users
    SET access_token = $2, refresh_token = $3
    WHERE id = $1
    RETURNING *;
  `;
  const values = [userId, accessToken, refreshToken];
  const result = await client.query(query, values);
  return result.rows[0];
}

async function isUserLogged(userId, serviceId) {
  const query = 'SELECT is_logged FROM user_services WHERE user_id = $1 AND service_id = $2';
  const values = [userId, serviceId];
  const result = await client.query(query, values);
    return result.rows[0]?.is_logged;
}

const { Pool } = require('pg');
require('dotenv').config();

// Create a pool using environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER.replace(/"/g, ''), // Remove quotes
  password: process.env.DB_PASSWORD.replace(/"/g, ''), // Remove quotes
  database: process.env.DB_DATABASE
});

// Add error handler
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Replace the existing client with pool
async function getUserServiceByEmailAndServiceName(email, serviceName) {
  const query = `
    SELECT us.id, us.access_token, us.refresh_token
    FROM user_services us
    JOIN users u ON us.user_id = u.id
    JOIN services s ON us.service_id = s.id
    WHERE u.email = $1 AND s.name = $2
  `;
  const values = [email, serviceName];
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

async function updateUserServiceTokens(userServiceId, accessToken, refreshToken) {
  const query = `
    UPDATE user_services
    SET access_token = $1, refresh_token = $2
    WHERE id = $3
  `;
  const values = [accessToken, refreshToken, userServiceId];
  try {
    await pool.query(query, values);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

module.exports = {
    createUserServiceID,
    createUserServiceEMAIL,
    getUserServices,
    getUserServicesByUserId,
    getUserServicesByServiceId,
    updateUserServiceAccessToken,
    updateUserServiceRefreshToken,
    deleteUserService,
    deleteUserServiceByUserIdAndServiceId,
    deleteUserServicesByUserId,
    deleteUserServicesByServiceId,
    getUserIdByEmail,
    storeTokens,
    getUserServicesByUserMail,
    getAccessTokenByEmailAndServiceName,
    isUserLogged,
    getUserServiceByEmailAndServiceName,
    updateUserServiceTokens
};
