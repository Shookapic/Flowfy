const request = require('supertest');
const express = require('express');
const users = require('../src/crud_users');
const services = require('../src/crud_services');
const actions = require('../src/crud_actions');
const reactions = require('../src/crud_reactions');
const app = require('../src/server');

let server;

jest.mock('../src/crud_users', () => ({
  getUsers: jest.fn(),
  createUser: jest.fn(),
  deleteUser: jest.fn(),
  updateUser: jest.fn(),
}));

jest.mock('../src/crud_services', () => ({
  getServices: jest.fn(),
  createService: jest.fn(),
  deleteService: jest.fn(),
  updateService: jest.fn(),
}));

jest.mock('../src/crud_actions', () => ({
  getActions: jest.fn(),
  createAction: jest.fn(),
  deleteAction: jest.fn(),
  updateAction: jest.fn(),
}));

jest.mock('../src/crud_reactions', () => ({
  getReactions: jest.fn(),
  createReaction: jest.fn(),
  deleteReaction: jest.fn(),
  updateReaction: jest.fn(),
}));

beforeAll(() => {
  // Start the server before all tests
  server = app.listen(3000, () => {
    console.log('Server is running on http://flowfy.duckdns.org:3000');
  });
});

afterAll(() => {
  // Close the server after all tests
  server.close();
});

describe('Express API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/users', () => {
    it('GET /users should return all users', async () => {
      users.getUsers.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
      const response = await request(app).get('/users');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, email: 'test@example.com' }]);
      expect(users.getUsers).toHaveBeenCalled();
    });

    it('POST /delete-user should delete a user', async () => {
      users.deleteUser.mockResolvedValue();
      const response = await request(app).post('/delete-user').send({ id: 1 });
      expect(response.status).toBe(200);
      expect(response.text).toBe('User deleted');
      expect(users.deleteUser).toHaveBeenCalledWith(1);
    });

    it('POST /update-user should update a user', async () => {
      users.updateUser.mockResolvedValue();
      const userData = { id: 1, email: 'update@example.com', areas: ['area1'] };
      const response = await request(app).post('/update-user').send(userData);
      expect(response.status).toBe(200);
      expect(response.text).toBe('User updated');
      expect(users.updateUser).toHaveBeenCalledWith(1, 'update@example.com', ['area1']);
    });
  });

  describe('/services', () => {
    it('GET /services should return all services', async () => {
      services.getServices.mockResolvedValue([{ id: 1, name: 'Service1' }]);
      const response = await request(app).get('/services');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, name: 'Service1' }]);
      expect(services.getServices).toHaveBeenCalled();
    });

    it('POST /add_services should create a service', async () => {
      services.createService.mockResolvedValue();
      const response = await request(app).post('/add_services').send({ name: 'NewService' });
      expect(response.status).toBe(201);
      expect(response.text).toBe('Service created');
      expect(services.createService).toHaveBeenCalledWith('NewService');
    });

    it('POST /delete-service should delete a service', async () => {
      services.deleteService.mockResolvedValue();
      const response = await request(app).post('/delete-service').send({ id: 1 });
      expect(response.status).toBe(200);
      expect(response.text).toBe('Service deleted');
      expect(services.deleteService).toHaveBeenCalledWith(1);
    });

    it('POST /update-service should update a service', async () => {
      services.updateService.mockResolvedValue();
      const serviceData = { id: 1, name: 'UpdatedService' };
      const response = await request(app).post('/update-service').send(serviceData);
      expect(response.status).toBe(200);
      expect(response.text).toBe('Service updated');
      expect(services.updateService).toHaveBeenCalledWith(1, 'UpdatedService');
    });
  });

  describe('/reactions', () => {
    it('GET /reactions should return all reactions', async () => {
      reactions.getReactions.mockResolvedValue([{ id: 1, description: 'Reaction1' }]);
      const response = await request(app).get('/reactions');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, description: 'Reaction1' }]);
      expect(reactions.getReactions).toHaveBeenCalled();
    });

    it('POST /delete-reaction should delete a reaction', async () => {
      reactions.deleteReaction.mockResolvedValue();
      const response = await request(app).post('/delete-reaction').send({ id: 1 });
      expect(response.status).toBe(200);
      expect(response.text).toBe('Reaction deleted');
      expect(reactions.deleteReaction).toHaveBeenCalledWith(1);
    });

    it('POST /update-reaction should update a reaction', async () => {
      reactions.updateReaction.mockResolvedValue();
      const reactionData = { id: 1, description: 'UpdatedReaction' };
      const response = await request(app).post('/update-reaction').send(reactionData);
      expect(response.status).toBe(200);
      expect(response.text).toBe('Reaction updated');
      expect(reactions.updateReaction).toHaveBeenCalledWith(1, 'UpdatedReaction');
    });
  });

  describe('/actions', () => {
    it('POST /actions should return all actions', async () => {
      actions.getActions.mockResolvedValue([{ id: 1, description: 'Action1' }]);
      const response = await request(app).post('/actions');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, description: 'Action1' }]);
      expect(actions.getActions).toHaveBeenCalled();
    });

    it('POST /add-actions should create an action', async () => {
      actions.createAction.mockResolvedValue();
      const actionData = { serviceId: 1, description: 'NewAction' };
      const response = await request(app).post('/add-actions').send(actionData);
      expect(response.status).toBe(201);
      expect(response.text).toBe('Action created');
      expect(actions.createAction).toHaveBeenCalledWith(1, 'NewAction');
    });

    it('POST /delete-action should delete an action', async () => {
      actions.deleteAction.mockResolvedValue();
      const response = await request(app).post('/delete-action').send({ id: 1 });
      expect(response.status).toBe(200);
      expect(response.text).toBe('Action deleted');
      expect(actions.deleteAction).toHaveBeenCalledWith(1);
    });

    it('POST /update-action should update an action', async () => {
      actions.updateAction.mockResolvedValue();
      const actionData = { id: 1, description: 'UpdatedAction' };
      const response = await request(app).post('/update-action').send(actionData);
      expect(response.status).toBe(200);
      expect(response.text).toBe('Action updated');
      expect(actions.updateAction).toHaveBeenCalledWith(1, 'UpdatedAction');
    });
  });
});
