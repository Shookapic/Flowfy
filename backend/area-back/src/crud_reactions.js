/**
 * Database client instance for performing CRUD operations.
 * @type {Object}
 */
const client = require('./db');

/**
 * Creates a new reaction in the database.
 *
 * @param {number} serviceId - The ID of the service associated with the reaction.
 * @param {string} description - The description of the reaction.
 * @returns {Promise<void>} - A promise that resolves when the reaction is created.
 */
async function createReaction(serviceId, description) {
  const query = 'INSERT INTO reactions(service_id, description) VALUES($1, $2) RETURNING *';
  const values = [serviceId, description];
  const res = await client.query(query, values);
  console.log('Reaction Created:', res.rows[0]);
}

/**
 * Fetches all reactions from the database.
 * 
 * @async
 * @function getReactions
 * @returns {Promise<void>} A promise that resolves when the reactions have been fetched and logged.
 */
async function getReactions() {
  const query = 'SELECT * FROM reactions';
  const res = await client.query(query);
  console.log('Reactions:', res.rows);
  return res.rows;
}

/**
 * Updates the description of a reaction in the database.
 *
 * @param {number} id - The ID of the reaction to update.
 * @param {string} newDescription - The new description for the reaction.
 * @returns {Promise<void>} - A promise that resolves when the reaction is updated.
 */
async function updateReaction(id, newDescription) {
  const query = 'UPDATE reactions SET description = $1 WHERE id = $2 RETURNING *';
  const values = [newDescription, id];
  const res = await client.query(query, values);
  console.log('Reaction Updated:', res.rows[0]);
}

/**
 * Deletes a reaction from the database based on the provided ID.
 *
 * @async
 * @function deleteReaction
 * @param {number} id - The ID of the reaction to be deleted.
 * @returns {Promise<void>} - A promise that resolves when the reaction is deleted.
 */
async function deleteReaction(id) {
  const query = 'DELETE FROM reactions WHERE id = $1 RETURNING *';
  const values = [id];
  const res = await client.query(query, values);
  console.log('Reaction Deleted:', res.rows[0]);
}

async function getReactionsByServiceId(serviceId) {
  const query = 'SELECT * FROM reactions WHERE service_id = $1';
  const values = [serviceId];
  const res = await client.query(query, values);
  console.log('Reactions:', res.rows);
  return res.rows;
}

async function getReactionIdByDescription(description) {
  const query = 'SELECT id FROM reactions WHERE description = $1';
  const values = [description];
  const res = await client.query(query, values);
  console.log('Reaction ID:', res.rows[0]);
  return res.rows[0];
}

// Export the functions for use in other modules.
module.exports = {
  createReaction,
  getReactions,
  updateReaction,
  deleteReaction,
  getReactionsByServiceId,
  getReactionIdByDescription
};
