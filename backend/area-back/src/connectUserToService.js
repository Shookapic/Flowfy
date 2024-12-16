const { getUserIdByEmail, createUserServiceID } = require('./crud_user_services');

const client = require('./db');

/**
 * Connects a user to a specified service by storing the access and refresh tokens.
 *
 * @param {string} email - The email of the user to connect.
 * @param {string} serviceName - The name of the service to connect the user to.
 * @param {string} accessToken - The access token for the service.
 * @param {string} refreshToken - The refresh token for the service.
 * @throws {Error} If the user is not found, the service is not found, or there is an error connecting the user to the service.
 * @returns {Promise<void>} A promise that resolves when the user is successfully connected to the service.
 */
async function connectUserToService(email, serviceName, accessToken, refreshToken) {
  try {
    // Retrieve the user ID
    const userId = await getUserIdByEmail(email);
    if (!userId) {
      throw new Error('User not found');
    }

    // Retrieve the service ID for Twitter
    const serviceQuery = 'SELECT id FROM services WHERE name = $1';
    const serviceValues = [serviceName];
    const serviceRes = await client.query(serviceQuery, serviceValues);
    if (serviceRes.rows.length === 0) {
      throw new Error('Service not found');
    }
    const serviceId = serviceRes.rows[0].id;

    // Call createUserService with the appropriate parameters
    await createUserServiceID(userId, serviceId, accessToken, refreshToken, true);
    console.log(`User ${email} connected to ${serviceName}`);
  } catch (error) {
    console.error('Error connecting user to service:', error);
    throw new Error('Error connecting user to service');
  }
}

module.exports = { connectUserToService };