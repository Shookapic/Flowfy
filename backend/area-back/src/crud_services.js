/**
 * Database client instance for performing CRUD operations.
 * @type {Object}
 */
const client = require('./db');

/**
 * Creates a new service in the database.
 *
 * @async
 * @function createService
 * @param {string} name - The name of the service to be created.
 * @returns {Promise<void>} - A promise that resolves when the service is created.
 * @throws {Error} - Throws an error if the database query fails.
 */
async function createService(name) {
  const query = 'INSERT INTO services(name) VALUES($1) RETURNING *';
  const values = [name];
  const res = await client.query(query, values);
  console.log('Service Created:', res.rows[0]);
}

/**
 * Fetches all services from the database.
 *
 * @async
 * @function getServices
 * @returns {Promise<void>} A promise that resolves when the services have been fetched and logged.
 */
async function getServices() {
  const query = 'SELECT * FROM services';
  const res = await client.query(query);
  console.log('Services:', res.rows);
}

/**
 * Updates the name of a service in the database.
 *
 * @param {number} id - The ID of the service to update.
 * @param {string} newName - The new name for the service.
 * @returns {Promise<void>} - A promise that resolves when the service is updated.
 */
async function updateService(id, newName) {
  const query = 'UPDATE services SET name = $1 WHERE id = $2 RETURNING *';
  const values = [newName, id];
  const res = await client.query(query, values);
  console.log('Service Updated:', res.rows[0]);
}

/**
 * Deletes a service from the database by its ID.
 *
 * @param {number} id - The ID of the service to delete.
 * @returns {Promise<void>} - A promise that resolves when the service is deleted.
 * @throws {Error} - Throws an error if the query fails.
 */
async function deleteService(id) {
  const query = 'DELETE FROM services WHERE id = $1 RETURNING *';
  const values = [id];
  const res = await client.query(query, values);
  console.log('Service Deleted:', res.rows[0]);
}

// Export the functions for use in other modules.
module.exports = {
  createService,
  getServices,
  updateService,
  deleteService
};
