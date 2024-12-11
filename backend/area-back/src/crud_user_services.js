const client = require('./db');

/**
 * Creates a new user_service in the database.
 *
 * @param {number} userId - The ID of the user.
 * @param {number} serviceId - The ID of the service.
 * @param {string} accessToken - The access token for the service.
 * @param {string} refreshToken - The refresh token for the service.
 * @param {boolean} isLogged - The logged status of the user for the service.
 * @returns {Promise<void>} - A promise that resolves when the user_service is created.
 */
async function createUserService(userId, serviceId, accessToken, refreshToken, isLogged) {
    const query = 'INSERT INTO user_services(user_id, service_id, access_token, refresh_token, is_logged) VALUES($1, $2, $3, $4, $5) RETURNING *';
    const values = [userId, serviceId, accessToken, refreshToken, isLogged];
    const res = await client.query(query, values);
    console.log('User Service Created:', res.rows[0]);
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
async function createUserService(userMail, serviceId, accessToken, refreshToken, isLogged) {
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

module.exports = {
    createUserService,
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
    isUserLogged
};
