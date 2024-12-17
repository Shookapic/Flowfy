const { google } = require('googleapis');
const { getUserServicesByUserMail } = require('./crud_user_services');
const fs = require('fs');
const path = require('path');
require('dotenv').config();


const calendarOauth2Client = new google.auth.OAuth2(
  process.env.CALENDAR_CLIENT_ID,
  process.env.CALENDAR_CLIENT_SECRET,
  'http://localhost:3000/api/auth/calendar/callback'
);

async function RcreateCalendarEvent(email) {
    const userServices = await getUserServicesByUserMail(email);
    if (!userServices || userServices.length === 0) {
        throw new Error('No services found for the user');
    }

    const calendarService = userServices.find(service => service.service_id === 8);
    if (!calendarService) {
        throw new Error('Calendar service not connected');
    }

    calendarOauth2Client.setCredentials({
        access_token: calendarService.access_token,
        refresh_token: calendarService.refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: calendarOauth2Client });

    const filePath = path.join(__dirname, 'mails_event.json');
    let events = [];

    // Read existing events from the JSON file
    if (fs.existsSync(filePath)) {
        events = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    try {
        // Process each event in the file
        for (const emailEvent of events) {
            // Check if the event is already created in the calendar
            if (emailEvent.calendarLink) {
                console.log(`Event "${emailEvent.eventName}" already exists in the calendar. Skipping.`);
                continue;
            }

            console.log(`Creating event: ${emailEvent.eventName} on ${emailEvent.eventDate}`);

            // Create the Google Calendar event
            const event = {
                summary: emailEvent.eventName,
                description: `Event created from email with subject: ${emailEvent.subject}`,
                start: { dateTime: emailEvent.eventDate, timeZone: 'UTC' },
                end: { dateTime: emailEvent.eventDate, timeZone: 'UTC' },
            };

            const calendarRes = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
            });

            console.log(`Event created successfully: ${calendarRes.data.htmlLink}`);

            // Update the event with the calendar link
            emailEvent.calendarLink = calendarRes.data.htmlLink;
        }

        // Write the updated events back to the JSON file
        fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
        console.log('Updated events written to mails_event.json');
    } catch (err) {
        console.error('Error creating calendar event:', err);
    }
}

module.exports = { RcreateCalendarEvent };
