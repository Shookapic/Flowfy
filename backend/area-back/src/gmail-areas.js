const { google } = require('googleapis');
const readline = require('readline');
const express = require('express');
const { getUserServicesByUserMail } = require('./crud_user_services');
const { createAction } = require('./crud_actions');
const { createReaction } = require('./crud_reactions');
const fs = require('fs');
const path = require('path');
const { OAuth2 } = google.auth;
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:3000/api/auth/gmail/callback'
);

const emailFilePath = './src/emails.json';
// Function to list recent messages
async function listMessages() {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const res = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    q: 'is:unread', // Filter for unread messages
    maxResults: 1,   // Limit to the latest email
  });
  const messages = res.data.messages || [];
  console.log('Unread messages:');
  messages.forEach((message) => {
    console.log(`- Message ID: ${message.id}`);
  });

  // React by sending a reply (for example)
  if (messages.length > 0) {
    await sendMessage(messages[0].id);
  }
}

// Function to send a reply email
async function sendMessage(messageId) {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const rawMessage = `To: recipient@example.com\nSubject: Re: Your Subject\n\nThis is a reply!`;

  const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
  console.log('Sent message:', res.data);
}

// Function to check if we have stored tokens already
async function checkStoredTokens() {
  try {
    const tokens = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(tokens));
    await listMessages(); // If tokens exist, list messages
  } catch (error) {
    console.log('No token found, need to authenticate');
    await authorize(); // No tokens, authenticate
  }
}

async function AonMailSend(email) {
  try {
    // Retrieve the user's YouTube service credentials
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
      throw new Error('No services found for the user');
    }
    const gmailService = userServices.find(service => service.service_id === 7);
    if (!gmailService) {
      throw new Error('Gmail service not connected');
    }
    // Set the credentials for the OAuth2 client
    oauth2Client.setCredentials({
      access_token: gmailService.access_token,
      refresh_token: gmailService.refresh_token
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client});

    const mailResponse = await gmail.email.list({
      part: 'contentDetails',
      mine: true
    })

  } catch (error) {
    console.error('Error handling on like event:', error);
  }
}


async function AlistEmails(email) {
  const userServices = await getUserServicesByUserMail(email);
  if (!userServices || userServices.length === 0) {
    throw new Error('No services found for the user');
  }
  const gmailService = userServices.find(service => service.service_id === 7);
  if (!gmailService) {
    throw new Error('Gmail service not connected');
  }

  // Set the credentials for the OAuth2 client
  oauth2Client.setCredentials({
    access_token: gmailService.access_token,
    refresh_token: gmailService.refresh_token
  });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // List unread messages from the inbox
  gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    q: 'is:unread',  // Filter for unread emails
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const messages = res.data.messages;
    if (messages && messages.length) {
      console.log('Found unread messages:');
      const emailDetails = [];

      messages.forEach((message) => {
        // Retrieve the full message to get details like the sender's email
        gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        }, (err, res) => {
          if (err) return console.log('Error fetching message:', err);

          const msg = res.data;
          console.log(`Snippet: ${msg.snippet}`);

          // Get the sender's email address from the "From" header
          const sender = msg.payload.headers.find(header => header.name === 'From').value;

          // Save the email details to the array
          emailDetails.push({
            messageId: message.id,
            sender: sender,
            threadId: msg.threadId
          });

          // Once all emails are processed, write to a file
          if (emailDetails.length === messages.length) {
            const dir = path.dirname(emailFilePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            // Write the email details to the file
            fs.writeFileSync(emailFilePath, JSON.stringify(emailDetails, null, 2));
            console.log('Email details saved to emails.json');
          }
        });
      });
    } else {
      console.log('No unread messages.');
    }
  });
}

async function RsendReply(email) {
  const userServices = await getUserServicesByUserMail(email);
  if (!userServices || userServices.length === 0) {
    throw new Error('No services found for the user');
  }
  const gmailService = userServices.find(service => service.service_id === 7);
  if (!gmailService) {
    throw new Error('Gmail service not connected');
  }

  // Set the credentials for the OAuth2 client
  oauth2Client.setCredentials({
    access_token: gmailService.access_token,
    refresh_token: gmailService.refresh_token
  });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Read the email details from the file
  const emailDetails = JSON.parse(fs.readFileSync('./src/emails.json'));

  for (const mail of emailDetails) {
    const reply = createReplyMessage(mail.sender, mail.threadId, email);
    await sendReplyToEmail(gmail, reply);
  }
}

function createReplyMessage(to, threadId, from) {
  const message = [
    `From: "me" ${from}`,  // Replace with your Gmail address
    `To: ${to}`,
    `Subject: Re: Your email`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    'Thank you for your email! I am currently unavailable and will get back to you as soon as possible.',
    ''
  ].join('\n');

  // Encode the message in base64url format
  const base64EncodedMessage = Buffer.from(message).toString('base64');
  return base64EncodedMessage.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Separate function to send the reply
function sendReplyToEmail(gmail, rawMessage) {
  return new Promise((resolve, reject) => {
    gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    }, (err, res) => {
      if (err) {
        console.log('Error sending reply:', err);
        reject(err);
      } else {
        console.log('Replied to message.');
        resolve(res);
      }
    });
  });
}

module.exports = { AlistEmails, RsendReply };