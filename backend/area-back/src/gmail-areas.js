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

const calendarOauth2Client = new google.auth.OAuth2(
  process.env.CALENDAR_CLIENT_ID,
  process.env.CALENDAR_CLIENT_SECRET,
  'http://localhost:3000/api/auth/calendar/callback'
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

async function AonSentEmailWithEventPattern(email) {
  const userServices = await getUserServicesByUserMail(email);
  if (!userServices || userServices.length === 0) {
    throw new Error('No services found for the user');
  }
  const gmailService = userServices.find(service => service.service_id === 7);
  if (!gmailService) {
    throw new Error('Gmail service not connected');
  }

  // Set OAuth2 credentials
  oauth2Client.setCredentials({
    access_token: gmailService.access_token,
    refresh_token: gmailService.refresh_token,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const query = `label:SENT subject:Event`;

  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 10, // Adjust the number of results as needed
    });

    const messages = res.data.messages;

    if (messages && messages.length > 0) {
      console.log('Checking for emails with pattern in the subject...');
      const regex = /Event (\d{2})\/(\d{2})\/(\d{2}) \[(.*?)\]/;

      // Read existing email data from the JSON file
      const filePath = path.resolve('./src/mails_event.json');
      let emailData = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        emailData = fileContent ? JSON.parse(fileContent) : [];
      }

      for (const message of messages) {
        const messageRes = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        const msg = messageRes.data;

        // Extract the subject header
        const subjectHeader = msg.payload.headers.find(header => header.name === 'Subject');
        const subject = subjectHeader ? subjectHeader.value : '';

        console.log(`Subject: ${subject}`);

        const match = subject.match(regex);
        if (match) {
          const [, day, month, year, eventName] = match;
          const eventDate = `20${year}-${month}-${day}T10:00:00Z`;

          // Prepare the email object
          const emailObject = {
            messageId: message.id,
            subject: subject,
            eventName: eventName,
            eventDate: eventDate,
          };

          // Check if the email object already exists in the file
          const isDuplicate = emailData.some(item => item.messageId === emailObject.messageId);
          if (isDuplicate) {
            console.log(`Duplicate email found: "${subject}". Skipping.`);
            continue;
          }

          // Add the new email object
          emailData.push(emailObject);

          console.log(`New email added: "${subject}"`);
        }
      }

      // Write the updated data back to the file
      fs.writeFileSync(filePath, JSON.stringify(emailData, null, 2));
      console.log(`Updated file written to ${filePath}`);
      return { found: true };
    } else {
      console.log('No emails found with "Event" in the subject.');
      return { found: false };
    }
  } catch (err) {
    console.error('Error checking sent emails:', err);
    throw err;
  }
}

async function AonStarEmails(email) {
  const userServices = await getUserServicesByUserMail(email);
  if (!userServices || userServices.length === 0) {
    throw new Error('No services found for the user');
  }

  const gmailService = userServices.find(service => service.service_id === 7);
  if (!gmailService) {
    throw new Error('Gmail service not connected');
  }

  // Set OAuth2 credentials
  oauth2Client.setCredentials({
    access_token: gmailService.access_token,
    refresh_token: gmailService.refresh_token,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    console.log('Fetching recent starred emails...');
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:starred',
      maxResults: 10, // Adjust the number of emails to fetch
    });

    const messages = res.data.messages;

    if (messages && messages.length > 0) {
      const starredEmails = [];

      for (const message of messages) {
        const messageRes = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        const msg = messageRes.data;

        // Extract headers like Subject and From
        const subjectHeader = msg.payload.headers.find(header => header.name === 'Subject');
        const fromHeader = msg.payload.headers.find(header => header.name === 'From');

        const subject = subjectHeader ? subjectHeader.value : 'No Subject';
        const from = fromHeader ? fromHeader.value : 'Unknown Sender';

        // Get the snippet
        const snippet = msg.snippet || 'No Snippet Available';

        // Add the email details to the result array
        starredEmails.push({
          messageId: message.id,
          subject,
          from,
          snippet,
        });
      }

      console.log('Recent starred emails fetched successfully:', starredEmails);

      // Optional: Save to a JSON file
      const filePath = path.join(__dirname, 'starred_emails.json');
      fs.writeFileSync(filePath, JSON.stringify(starredEmails, null, 2));
      console.log('Starred emails saved to starred_emails.json');

      return starredEmails;
    } else {
      console.log('No starred emails found.');
      return [];
    }
  } catch (err) {
    console.error('Error fetching starred emails:', err);
    throw err;
  }
}

async function RsendReplyStarredMail(email) {
  const userServices = await getUserServicesByUserMail(email);
  if (!userServices || userServices.length === 0) {
    throw new Error('No services found for the user');
  }

  const gmailService = userServices.find(service => service.service_id === 7);
  if (!gmailService) {
    throw new Error('Gmail service not connected');
  }

  // Set OAuth2 credentials
  oauth2Client.setCredentials({
    access_token: gmailService.access_token,
    refresh_token: gmailService.refresh_token,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Path to the JSON files
  const starredEmailsPath = path.join(__dirname, 'starred_emails.json');
  const repliedEmailsPath = path.join(__dirname, 'replied_starred_emails.json');

  try {
    // Check if the JSON files exist
    if (!fs.existsSync(starredEmailsPath)) {
      throw new Error('No starred_emails.json file found.');
    }

    // Initialize replied emails file if it doesn't exist
    if (!fs.existsSync(repliedEmailsPath)) {
      fs.writeFileSync(repliedEmailsPath, JSON.stringify([]));
    }

    // Read the starred and replied emails
    const starredEmails = JSON.parse(fs.readFileSync(starredEmailsPath, 'utf-8'));
    const repliedEmails = JSON.parse(fs.readFileSync(repliedEmailsPath, 'utf-8'));

    if (starredEmails.length === 0) {
      console.log('No starred emails to reply to.');
      return;
    }

    console.log('Sending replies to starred emails...');

    for (const emailData of starredEmails) {
      const { messageId, from } = emailData;

      if (!from || !messageId) {
        console.log('Missing email details. Skipping...');
        continue;
      }

      // Check if the email has already been replied to
      if (repliedEmails.includes(messageId)) {
        console.log(`Email with ID ${messageId} has already been replied to. Skipping...`);
        continue;
      }

      // Extract sender's email from "From" header
      const senderEmail = from.match(/<(.+)>/)?.[1] || from;

      const replySubject = 'Great mail';
      const replyBody = `Thanks for the mail`;

      // Create reply payload
      const rawMessage = [
        `To: ${senderEmail}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${messageId}`,
        `References: ${messageId}`,
        ``,
        replyBody,
      ].join('\n');

      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the reply
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log(`Replied to ${senderEmail} with message ID: ${res.data.id}`);

      // Add the messageId to replied emails
      repliedEmails.push(messageId);

      // Save updated replied emails list to file
      fs.writeFileSync(repliedEmailsPath, JSON.stringify(repliedEmails, null, 2));
    }

    console.log('Replies sent successfully.');
  } catch (err) {
    console.error('Error replying to starred emails:', err);
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

module.exports = { AlistEmails, AonStarEmails, AonSentEmailWithEventPattern, RsendReply, RsendReplyStarredMail };