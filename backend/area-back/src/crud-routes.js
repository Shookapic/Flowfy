const express = require('express');
const users = require('./crud_users');
const services = require('./crud_services');
const actions = require('./crud_actions');
const reactions = require('./crud_reactions');

const router = express.Router();

router.get('/users', async (req, res) => {
    try {
        const result = await users.getUsers();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching users');
    }
});

router.post('/add-users', async (req, res) => {
    const { email, areas, is_logged, accessToken, refreshToken } = req.body;
    try {
        await users.createUser(email, areas, is_logged, accessToken, refreshToken);
        res.status(201).send('User created');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating user');
    }
});

router.post('/delete-user', async (req, res) => {
    const { id } = req.body;
    try {
        await users.deleteUser(id);
        res.status(200).send('User deleted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting user');
    }
});

router.post('/update-user', async (req, res) => {
    const { id, email, areas } = req.body;
    try {
        await users.updateUser(id, email, areas);
        res.status(200).send('User updated');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating user');
    }
});

router.get('/services', async (req, res) => {
    try {
        const result = await services.getServices();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching services');
    }
});

router.post('/add_services', async (req, res) => {
    const { name } = req.body;
    try {
        await services.createService(name);
        res.status(201).send('Service created');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating service');
    }
});

router.post('/delete-service', async (req, res) => {
    const { id } = req.body;
    try {
        await services.deleteService(id);
        res.status(200).send('Service deleted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting service');
    }
});

router.post('/update-service', async (req, res) => {
    const { id, name } = req.body;
    try {
        await services.updateService(id, name);
        res.status(200).send('Service updated');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating service');
    }
});

router.get('/reactions', async (req, res) => {
    try {
        const result = await reactions.getReactions();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching reactions');
    }
});

router.post('/add-reactions', async (req, res) => {
    const { serviceId, description } = req.body;
    try {
        await reactions.createReaction(serviceId, description);
        res.status(201).send('Reaction created');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating reaction');
    }
});

router.post('/delete-reaction', async (req, res) => {
    const { id } = req.body;
    try {
        await reactions.deleteReaction(id);
        res.status(200).send('Reaction deleted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting reaction');
    }
});

router.post('/update-reaction', async (req, res) => {
    const { id, description } = req.body;
    try {
        await reactions.updateReaction(id, description);
        res.status(200).send('Reaction updated');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating reaction');
    }
});

router.post('/actions', async (req, res) => {
    try {
        const result = await actions.getActions();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching actions');
    }
});

router.post('/add-actions', async (req, res) => {
    const { serviceId, description } = req.body;
    try {
        await actions.createAction(serviceId, description);
        res.status(201).send('Action created');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating action');
    }
});

router.post('/delete-action', async (req, res) => {
    const { id } = req.body;
    try {
        await actions.deleteAction(id);
        res.status(200).send('Action deleted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting action');
    }
});

router.post('/update-action', async (req, res) => {
    const { id, description } = req.body;
    try {
        await actions.updateAction(id, description);
        res.status(200).send('Action updated');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating action');
    }
});

router.get('/get-user-by-email', async (req, res) => {
    const { email } = req.query;
    try {
        const result = await users.getUserByEmail(email);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching user');
    }
});

router.get('/isUserLogged', async (req, res) => {
    const { email } = req.query;
    try {
        const result = await users.isUserLogged(email);
        if (result) {
            const isLogged = result.is_logged; // Extract the is_logged field
            res.status(200).json({ is_logged: isLogged }); // Send proper JSON response
        } else {
            res.status(404).json({ is_logged: false }); // User not found
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching user');
    }
});

router.get('/setUserLoggedStatus', async (req, res) => {
    const { email, status } = req.query;
    try {
        await users.setUserLoggedStatus(email, status);
        res.status(200).send('User logged status updated');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating user logged status');
    }
});

router.get('/get-actions-by-service-id', async (req, res) => {
    const { serviceId } = req.query;
    try {
        const result = await actions.getActionsByServiceId(serviceId);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching actions');
    }
});

router.get('/get-reactions-by-service-id', async (req, res) => {
    const { serviceId } = req.query;
    try {
        const result = await reactions.getReactionsByServiceId(serviceId);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching reactions');
    }
});

module.exports = router;
