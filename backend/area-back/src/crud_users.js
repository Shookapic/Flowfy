/**
 * Database client instance for performing CRUD operations.
 * @type {Object}
 */
const client = require('./db');

/**
 * Creates a new user in the database.
 *
 * @param {string} email - The email of the user to be created.
 * @param {Array} areas - The areas associated with the user.
 * @returns {Promise<void>} - A promise that resolves when the user is created.
 */
async function createUser(email, areas) {
  const query = 'INSERT INTO users(email, areas) VALUES($1, $2) RETURNING *';
  const values = [email, areas];
  const res = await client.query(query, values);
  console.log('User Created:', res.rows[0]);
}

/**
 * Fetches all users from the database.
 *
 * @async
 * @function getUsers
 * @returns {Promise<void>} A promise that resolves when the users have been fetched and logged.
 */
async function getUsers() {
  const query = 'SELECT * FROM users';
  const res = await client.query(query);
  return res.rows;
}

/**
 * Updates a user's email and areas in the database.
 *
 * @param {number} id - The ID of the user to update.
 * @param {string} newEmail - The new email address for the user.
 * @param {Array} newAreas - The new areas associated with the user.
 * @returns {Promise<void>} - A promise that resolves when the user is updated.
 */
async function updateUser(id, newEmail, newAreas) {
  const query = 'UPDATE users SET email = $1, areas = $2 WHERE id = $3 RETURNING *';
  const values = [newEmail, newAreas, id];
  const res = await client.query(query, values);
  console.log('User Updated:', res.rows[0]);
}

/**
 * Deletes a user from the database by their ID.
 *
 * @async
 * @function deleteUser
 * @param {number} id - The ID of the user to delete.
 * @returns {Promise<void>} - A promise that resolves when the user is deleted.
 */
async function deleteUser(id) {
  const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
  const values = [id];
  const res = await client.query(query, values);
  console.log('User Deleted:', res.rows[0]);
}

/**
 * Creates a new user in the database or updates the existing user's information.
 * 
 * @async
 * @function createUser
 * @param {string} email - The email address of the user.
 * @param {Array} areas - The areas associated with the user.
 * @param {boolean} is_logged - The logged status of the user.
 * @param {string} access_token - The access token for the user.
 * @param {string} refresh_token - The refresh token for the user.
 * 
 * @returns {Promise<void>} - A promise that resolves when the user is created or updated.
 * @throws {Error} - Throws an error if the database query fails.
 */
async function createUser(email, areas, is_logged, access_token, refresh_token) {
  try {
    // Check if the user already exists
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkRes = await client.query(checkQuery, [email]);

    if (checkRes.rows.length > 0) {
      // Update the existing user
      const updateQuery = 'UPDATE users SET areas = $2, is_logged = $3, access_token = $4, refresh_token = $5 WHERE email = $1 RETURNING *';
      const updateValues = [email, areas, is_logged, access_token, refresh_token];
      const updateRes = await client.query(updateQuery, updateValues);
      console.log('User Updated:', updateRes.rows[0]);
    } else {
      // Insert the new user
      const insertQuery = 'INSERT INTO users(email, areas, is_logged, access_token, refresh_token) VALUES($1, $2, $3, $4, $5) RETURNING *';
      const insertValues = [email, areas, is_logged, access_token, refresh_token];
      const insertRes = await client.query(insertQuery, insertValues);
      console.log('User Created:', insertRes.rows[0]);
    }
  } catch (error) {
    console.error('Error creating or updating user:', error);
    throw new Error('Error creating or updating user');
  }
}

/**
 * Updates a user's email and areas in the database.
 *
 * @param {number} id - The ID of the user to update.
 * @param {string} newEmail - The new email address for the user.
 * @param {Array} newAreas - The new areas associated with the user.
 * @returns {Promise<void>} - A promise that resolves when the user is updated.
 */
async function updateUser(id, newEmail, newAreas, newIsLogged, newAccessToken, newRefreshToken) {
  const query = 'UPDATE users SET email = $1, areas = $2, is_logged = $3, access_token = $4, refresh_token = $5 WHERE id = $6 RETURNING *';
  const values = [newEmail, newAreas, newIsLogged, newAccessToken, newRefreshToken, id];
  const res = await client.query(query, values);
  console.log('User Updated:', res.rows[0]);
}

async function getUserByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = $1';
  const values = [email];
  const res = await client.query(query, values);
  console.log('User:', res.rows);
}

async function isUserLogged(email) {
  const query = 'SELECT is_logged FROM users WHERE email = $1';
  const values = [email];
  const res = await client.query(query, values);

  console.log('User:', res.rows); // Log the database response

  // Return the first row if available, otherwise null
  return res.rows[0] || null;
}

async function setUserLoggedStatus(email, status) {
  const query = 'UPDATE users SET is_logged = $1 WHERE email = $2 RETURNING *';
  const values = [status, email];
  const res = await client.query(query, values);
  console.log('User Updated:', res.rows[0]);
}


// Export the functions for use in other modules.
module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  getUserByEmail,
  isUserLogged,
  setUserLoggedStatus
};
