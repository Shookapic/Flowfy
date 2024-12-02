const client = require('./db');

async function createUser(email, areas) {
  const query = 'INSERT INTO users(email, areas) VALUES($1, $2) RETURNING *';
  const values = [email, areas];
  const res = await client.query(query, values);
  console.log('User Created:', res.rows[0]);
}

async function getUsers() {
  const query = 'SELECT * FROM users';
  const res = await client.query(query);
  console.log('Users:', res.rows);
}

async function updateUser(id, newEmail, newAreas) {
  const query = 'UPDATE users SET email = $1, areas = $2 WHERE id = $3 RETURNING *';
  const values = [newEmail, newAreas, id];
  const res = await client.query(query, values);
  console.log('User Updated:', res.rows[0]);
}

async function deleteUser(id) {
  const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
  const values = [id];
  const res = await client.query(query, values);
  console.log('User Deleted:', res.rows[0]);
}

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser
};
