const express = require('express');
const users = require('./crud_users');
const services = require('./crud_services');
const actions = require('./crud_actions');
const reactions = require('./crud_reactions');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/users', async (req, res) => {
  try {
    const result = await users.getUsers();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching users');
  }
});

app.post('/add-users', async (req, res) => {
  const { email, areas } = req.body;
  try {
    await users.createUser(email, areas);
    res.status(201).send('User created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating user');
  }
});

app.post('/delete-user', async (req, res) => {
  const { id } = req.body;
  try {
    await users.deleteUser(id);
    res.status(200).send('User deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting user');
  }
});

app.post('/update-user', async (req, res) => {
  const { id, email, areas } = req.body;
  try {
    await users.updateUser(id, email, areas);
    res.status(200).send('User updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating user');
  }
});

app.get('/services', async (req, res) => {
  try {
    const result = await services.getServices();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching services');
  }
});

app.post('/add_services', async (req, res) => {
  const { name } = req.body;
  try {
    await services.createService(name);
    res.status(201).send('Service created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating service');
  }
});

app/post('/delete-service', async (req, res) => {
  const { id } = req.body;
  try {
    await services.deleteService(id);
    res.status(200).send('Service deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting service');
  }
});

app.post('/update-service', async (req, res) => {
  const { id, name } = req.body;
  try {
    await services.updateService(id, name);
    res.status(200).send('Service updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating service');
  }
});

app.get('/reactions', async (req, res) => {
  try {
    const result = await reactions.getReactions();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching reactions');
  }
});

app.post('/add-reactions', async (req, res) => {
  const { serviceId, description } = req.body;
  try {
    await reactions.createReaction(serviceId, description);
    res.status(201).send('Reaction created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating reaction');
  }
});

app.post('/delete-reaction', async (req, res) => {
  const { id } = req.body;
  try {
    await reactions.deleteReaction(id);
    res.status(200).send('Reaction deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting reaction');
  }
});

app.post('/update-reaction', async (req, res) => {
  const { id, description } = req.body;
  try {
    await reactions.updateReaction(id, description);
    res.status(200).send('Reaction updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating reaction');
  }
});

app.post('/actions', async (req, res) => {
  try {
    const result = await actions.getActions();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching actions');
  }
});

app.post('/add-actions', async (req, res) => {
  const { serviceId, description } = req.body;
  try {
    await actions.createAction(serviceId, description);
    res.status(201).send('Action created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating action');
  }
});

app.post('/delete-action', async (req, res) => {
  const { id } = req.body;
  try {
    await actions.deleteAction(id);
    res.status(200).send('Action deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting action');
  }
});

app.post('/update-action', async (req, res) => {
  const { id, description } = req.body;
  try {
    await actions.updateAction(id, description);
    res.status(200).send('Action updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating action');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
