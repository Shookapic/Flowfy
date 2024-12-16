const { getUserIdByEmail, createUserServiceID } = require('./crud_user_services');

const client = require('./db');

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