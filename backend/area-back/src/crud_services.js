const client = require('./db');

async function createService(name) {
  const query = 'INSERT INTO services(name) VALUES($1) RETURNING *';
  const values = [name];
  const res = await client.query(query, values);
  console.log('Service Created:', res.rows[0]);
}

async function getServices() {
  const query = 'SELECT * FROM services';
  const res = await client.query(query);
  console.log('Services:', res.rows);
}

async function updateService(id, newName) {
  const query = 'UPDATE services SET name = $1 WHERE id = $2 RETURNING *';
  const values = [newName, id];
  const res = await client.query(query, values);
  console.log('Service Updated:', res.rows[0]);
}

async function deleteService(id) {
  const query = 'DELETE FROM services WHERE id = $1 RETURNING *';
  const values = [id];
  const res = await client.query(query, values);
  console.log('Service Deleted:', res.rows[0]);
}

module.exports = {
  createService,
  getServices,
  updateService,
  deleteService
};
