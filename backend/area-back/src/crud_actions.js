/**
 * Database client instance for performing CRUD operations.
 * @type {Object}
 */
const client = require('./db');

/**
 * Creates a new action in the database.
 *
 * @param {number} serviceId - The ID of the service associated with the action.
 * @param {string} description - A description of the action.
 * @returns {Promise<void>} - A promise that resolves when the action is created.
 * @throws {Error} - Throws an error if the database query fails.
 */
async function createAction(serviceId, description) {
  const query = 'INSERT INTO actions(service_id, description) VALUES($1, $2) RETURNING *';
  const values = [serviceId, description];
  const res = await client.query(query, values);
  console.log('Action Created:', res.rows[0]);
}

/**
 * Fetches all actions from the database and logs them to the console.
 * 
 * @async
 * @function getActions
 * @returns {Promise<void>} A promise that resolves when the actions are fetched and logged.
 */
async function getActions() {
  const query = 'SELECT * FROM actions';
  const res = await client.query(query);
  console.log('Actions:', res.rows);
}

/**
 * Updates the description of an action in the database.
 *
 * @param {number} id - The ID of the action to update.
 * @param {string} newDescription - The new description for the action.
 * @returns {Promise<void>} A promise that resolves when the action is updated.
 */
async function updateAction(id, newDescription) {
  const query = 'UPDATE actions SET description = $1 WHERE id = $2 RETURNING *';
  const values = [newDescription, id];
  const res = await client.query(query, values);
  console.log('Action Updated:', res.rows[0]);
}

/**
 * Deletes an action from the database by its ID.
 *
 * @param {number} id - The ID of the action to delete.
 * @returns {Promise<void>} - A promise that resolves when the action is deleted.
 * @throws {Error} - Throws an error if the query fails.
 */
async function deleteAction(id) {
  const query = 'DELETE FROM actions WHERE id = $1 RETURNING *';
  const values = [id];
  const res = await client.query(query, values);
  console.log('Action Deleted:', res.rows[0]);
}

// Export the functions for use in other modules.
module.exports = {
  createAction,
  getActions,
  updateAction,
  deleteAction
};
