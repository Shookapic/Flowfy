/**
 * @file crud-routes.js
 * @description Express router module for performing CRUD operations on users, services, actions, and reactions.
 */

const express = require('express');
const users = require('./crud_users');
const services = require('./crud_services');
const actions = require('./crud_actions');
const reactions = require('./crud_reactions');
const serviceUser = require('./crud_user_services');

const router = express.Router();

/**
 * Get all users.
 * @name GET /users
 * @function
 * @memberof module:crud-routes
 */
router.get('/users', async (req, res) => {
    try {
        const result = await users.getUsers();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching users');
    }
});

/**
 * Add a new user.
 * @name POST /add-users
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.email - The email address of the user.
 * @param {Array} req.body.areas - The areas associated with the user.
 * @param {boolean} req.body.is_logged - Indicates if the user is logged in.
 * @param {string} req.body.accessToken - The access token for authentication.
 * @param {string} req.body.refreshToken - The refresh token for authentication.
 */
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

/**
 * Delete a user.
 * @name POST /delete-user
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.id - The ID of the user to delete.
 */
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

/**
 * Update a user.
 * @name POST /update-user
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.id - The ID of the user to update.
 * @param {string} req.body.email - The new email address of the user.
 * @param {Array} req.body.areas - The new areas associated with the user.
 */
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

/**
 * Get all services.
 * @name GET /services
 * @function
 * @memberof module:crud-routes
 */
router.get('/services', async (req, res) => {
    try {
        const result = await services.getServices();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching services');
    }
});

/**
 * Add a new service.
 * @name POST /add_services
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.name - The name of the service to create.
 */
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

/**
 * Delete a service.
 * @name POST /delete-service
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.id - The ID of the service to delete.
 */
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

/**
 * Update a service.
 * @name POST /update-service
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.id - The ID of the service to update.
 * @param {string} req.body.name - The new name of the service.
 */
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

/**
 * Get all reactions.
 * @name GET /reactions
 * @function
 * @memberof module:crud-routes
 */
router.get('/reactions', async (req, res) => {
    try {
        const result = await reactions.getReactions();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching reactions');
    }
});

/**
 * Add a new reaction.
 * @name POST /add-reactions
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.serviceId - The ID of the service associated with the reaction.
 * @param {string} req.body.description - The description of the reaction.
 */
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

/**
 * Delete a reaction.
 * @name POST /delete-reaction
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.id - The ID of the reaction to delete.
 */
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

/**
 * Update a reaction.
 * @name POST /update-reaction
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.id - The ID of the reaction to update.
 * @param {string} req.body.description - The new description of the reaction.
 */
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

/**
 * Get all actions.
 * @name POST /actions
 * @function
 * @memberof module:crud-routes
 */
router.post('/actions', async (req, res) => {
    try {
        const result = await actions.getActions();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching actions');
    }
});

/**
 * Add a new action.
 * @name POST /add-actions
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.serviceId - The ID of the service associated with the action.
 * @param {string} req.body.description - The description of the action.
 */
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

/**
 * Delete an action.
 * @name POST /delete-action
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.id - The ID of the action to delete.
 */
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

/**
 * Update an action.
 * @name POST /update-action
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.id - The ID of the action to update.
 * @param {string} req.body.description - The new description of the action.
 */
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

/**
 * Get a user by email.
 * @name GET /get-user-by-email
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.email - The email address of the user.
 */
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

/**
 * Check if a user is logged in.
 * @name GET /isUserLogged
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.email - The email address of the user.
 */
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

/**
 * Set the logged status of a user.
 * @name GET /setUserLoggedStatus
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.email - The email address of the user.
 * @param {boolean} req.query.status - The new logged status of the user.
 */
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

/**
 * Get actions by service ID.
 * @name GET /get-actions-by-service-id
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {number} req.query.serviceId - The ID of the service.
 */
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

/**
 * Get reactions by service ID.
 * @name GET /get-reactions-by-service-id
 * @function
 * @memberof module:crud-routes
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {number} req.query.serviceId - The ID of the service.
 */
router.get('/get-reactions-by-service-id', async (req, res) => {
    const { serviceId } = req.query;
    try {
        const result = await reactions.getReactionsByServiceId(serviceId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error fetching reactions');
    }
});

router.post('/save-action-reaction', async (req, res) => {
    console.log("///////////////////// GONNA SAVE ACTION REACTION///////////////////////////");
    const { email, areas } = req.body;
    console.log("request body: ", req.body);

    if (!areas) {
        return res.status(400).send('Areas field is required.');
    }

    const actionReactionPairs = areas.split(',');
    const actionNames = [];
    const reactionDescriptions = [];

    actionReactionPairs.forEach(pair => {
        const [actionName, reactionDescription] = pair.split(':');
        if (actionName && reactionDescription) {
            actionNames.push(actionName.trim());
            reactionDescriptions.push(reactionDescription.trim());
        }
    });

    try {
        const actionIds = await Promise.all(actionNames.map(name => actions.getActionIdByDescription(name).then(result => result.id)));
        const reactionIds = await Promise.all(reactionDescriptions.map(description => reactions.getReactionIdByDescription(description).then(result => result.id)));

        for (let i = 0; i < actionIds.length; i++) {
            if (!actionIds[i] || !reactionIds[i]) {
                return res.status(404).send('Action or reaction not found.');
            }
            await users.setAreas(email, actionIds[i], reactionIds[i]);
        }

        res.status(200).send('Action-reaction pairs saved successfully.');
    } catch (error) {
        console.error('Error saving action-reaction:', error);
        res.status(500).send('Internal server error.');
    }
});


/**
 * Checks if the user is logged in for a specific service.
 *
 * @param {string} userID - The ID of the user to check.
 * @param {string} service_id - The ID of the service to check.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the user is logged in.
 */
router.get('/is_user_logged_service', async (req, res) => {
    console.log("PASSSSSSSSSSSSSSSSSSSSSSSSINNNNNNNNNNNNNNNNNNNNNNNGGGGGGGGGGGGG");
    const { email, service_id } = req.query;
    console.log("email: ", email);
    console.log("service_id: ", service_id);
    const userID = await serviceUser.getUserIdByEmail(email);
    const result = await serviceUser.isUserLogged(userID, service_id);
    if (result === true) {
        res.status(200).send('User is logged in for this service');
    } else {
        res.status(404).send('User is not logged in for this service');
    }
});

module.exports = router;
