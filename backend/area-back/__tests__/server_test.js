const request = require('supertest')
const express = require('express')

const app = express()

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/home', (req, res) => {
  res.send('Hello Evan!')
})

// Tests
describe('GET /', () => {
  it('should return Hello World!', async () => {
    const response = await request(app).get('/')
    expect(response.status).toBe(200)
    expect(response.text).toBe('Hello World!')
  })
})

describe('GET /home', () => {
  it('should return Hello Evan!', async () => {
    const response = await request(app).get('/home')
    expect(response.status).toBe(200)
    expect(response.text).toBe('Hello Evan!')
  })
})
