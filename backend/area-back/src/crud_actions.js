const client = require('./db');

async function createAction(serviceId, description) {
  const query = 'INSERT INTO actions(service_id, description) VALUES($1, $2) RETURNING *';
  const values = [serviceId, description];
  const res = await client.query(query, values);
  console.log('Action Created:', res.rows[0]);
}

async function getActions() {
  const query = 'SELECT * FROM actions';
  const res = await client.query(query);
  console.log('Actions:', res.rows);
}

async function updateAction(id, newDescription) {
  const query = 'UPDATE actions SET description = $1 WHERE id = $2 RETURNING *';
  const values = [newDescription, id];
  const res = await client.query(query, values);
  console.log('Action Updated:', res.rows[0]);
}

async function deleteAction(id) {
  const query = 'DELETE FROM actions WHERE id = $1 RETURNING *';
  const values = [id];
  const res = await client.query(query, values);
  console.log('Action Deleted:', res.rows[0]);
}

module.exports = {
  createAction,
  getActions,
  updateAction,
  deleteAction
};
