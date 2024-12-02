const client = require('./db');

async function createReaction(serviceId, description) {
  const query = 'INSERT INTO reactions(service_id, description) VALUES($1, $2) RETURNING *';
  const values = [serviceId, description];
  const res = await client.query(query, values);
  console.log('Reaction Created:', res.rows[0]);
}

async function getReactions() {
  const query = 'SELECT * FROM reactions';
  const res = await client.query(query);
  console.log('Reactions:', res.rows);
}

async function updateReaction(id, newDescription) {
  const query = 'UPDATE reactions SET description = $1 WHERE id = $2 RETURNING *';
  const values = [newDescription, id];
  const res = await client.query(query, values);
  console.log('Reaction Updated:', res.rows[0]);
}

async function deleteReaction(id) {
  const query = 'DELETE FROM reactions WHERE id = $1 RETURNING *';
  const values = [id];
  const res = await client.query(query, values);
  console.log('Reaction Deleted:', res.rows[0]);
}

module.exports = {
  createReaction,
  getReactions,
  updateReaction,
  deleteReaction
};
