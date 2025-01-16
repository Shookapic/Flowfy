const axios = require('axios');
const fs = require('fs');
const { getUserServicesByUserMail } = require('./crud_user_services');

async function AonNewPullRequest(email) {
  console.log('Fetching recent pull requests...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Get user services by email
    const userServices = await getUserServicesByUserMail(email);
    const githubService = userServices.find(service => service.service_id === 6);

    if (!githubService) {
      throw new Error('GitHub service not found for this user');
    }

    if (!githubService.access_token) {
      throw new Error('GitHub access token is undefined');
    }

    console.log(`Using access token: ${githubService.access_token}`);

    // Make a call to GitHub API to get the authenticated user's details (including their username)
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${githubService.access_token}`
      }
    });

    const githubUsername = userResponse.data.login;
    console.log(`Authenticated GitHub username: ${githubUsername}`);

    // Make a call to GitHub API to search for open pull requests authored by the user
    const pullRequestResponse = await axios.get('https://api.github.com/search/issues', {
      headers: {
        Authorization: `token ${githubService.access_token}`
      },
      params: {
        q: `state:open author:${githubUsername} type:pr`
      }
    });

    // Write the data to a file named "recent pull request"
    fs.writeFileSync('recent_pull_requests.json', JSON.stringify(pullRequestResponse.data, null, 2));
    console.log('Recent pull requests have been saved.');
    return pullRequestResponse.data;
  } catch (error) {
    console.error('Error fetching pull requests:', error.response ? error.response.data : error.message);
  }
}

async function AonNewIssue(email) {
  console.log('Fetching recent issues...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Get user services by email
    const userServices = await getUserServicesByUserMail(email);
    const githubService = userServices.find(service => service.service_id === 6);

    if (!githubService) {
      throw new Error('GitHub service not found for this user');
    }

    if (!githubService.access_token) {
      throw new Error('GitHub access token is undefined');
    }

    console.log(`Using access token: ${githubService.access_token}`);

    // Make a call to GitHub API to get the authenticated user's details (including their username)
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${githubService.access_token}`
      }
    });

    const githubUsername = userResponse.data.login;
    console.log(`Authenticated GitHub username: ${githubUsername}`);

    // Make a call to GitHub API to search for open issues authored by the user
    const issueResponse = await axios.get('https://api.github.com/search/issues', {
      headers: {
        Authorization: `token ${githubService.access_token}`
      },
      params: {
        q: `state:open author:${githubUsername} type:issue`
      }
    });

    // Write the data to a file named "recent issue"
    fs.writeFileSync('recent_issues.json', JSON.stringify(issueResponse.data, null, 2));
    console.log('Recent issues have been saved.');
    return issueResponse.data;
  } catch (error) {
    console.error('Error fetching issues:', error.response ? error.response.data : error.message);
  }
}

// Function to add tasks to the "Github Tasks" Notion calendar
async function RaddTaskToNotion(email) {
  try {
    // Get user services by email
    const userServices = await getUserServicesByUserMail(email);
    const notionService = userServices.find(service => service.service_id === 9);

    if (!notionService) {
      throw new Error('Notion service not found for this user');
    }

    if (!notionService.access_token) {
      throw new Error('Notion access token is undefined');
    }

    console.log(`Using Notion access token: ${notionService.access_token}`);

    // Read the recent_pull_requests.json file to get the latest PR data
    const rawData = fs.readFileSync('recent_pull_requests.json');
    const prData = JSON.parse(rawData);

    // Check if there are any pull requests
    if (prData.items.length === 0) {
      throw new Error('No pull requests found.');
    }

    // Get the Notion database ID for the "Github Tasks" calendar
    const notionDatabaseId = process.env.NOTION_DATABASE_ID;

    // Iterate through the pull requests and add them to the Notion calendar
    for (let pr of prData.items) {
      // Prepare the task content for each PR
      const taskTitle = pr.title;
      const taskDate = pr.created_at;
      const prUrl = pr.html_url;

      console.log(`Adding task for PR: ${taskTitle} created at ${taskDate}`);

      // Make a call to Notion API to add the task to the "Github Tasks" calendar
      const response = await axios.post('https://api.notion.com/v1/pages', {
        parent: { database_id: notionDatabaseId }, // Use the found DATABASE_ID
        properties: {
          title: {
            title: [
              {
                text: {
                  content: `PR: ${taskTitle}`
                }
              }
            ]
          },
          date: {
            date: {
              start: taskDate // You can format this as needed (e.g., '2025-01-14T20:45:12Z')
            }
          },
          url: {
            url: prUrl
          }
        }
      }, {
        headers: {
          Authorization: `Bearer ${notionService.access_token}`,
          'Notion-Version': '2021-05-13', // Ensure you are using the correct Notion API version
        }
      });

      console.log('Task has been added to Notion:', response.data);
    }
  } catch (error) {
    console.error('Error adding task to Notion:', error.response ? error.response.data : error.message);
  }
}

async function RsendEmail(email) {
  try {
    // Fetch user services by email
    const userServices = await getUserServicesByUserMail(email);
    const outlookService = userServices.find(service => service.service_id === 10);

    if (!outlookService) {
      throw new Error('Outlook service not found for this user');
    }

    if (!outlookService.access_token) {
      throw new Error('Outlook access token is undefined');
    }

    console.log(`Using Outlook access token: ${outlookService.access_token}`);

    // Fetch the sender's email using the Microsoft Graph API
    const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${outlookService.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!meResponse.ok) {
      const errorData = await meResponse.text();
      throw new Error(`Failed to fetch sender email: ${errorData}`);
    }

    const meData = await meResponse.json();
    const senderEmail = meData.mail || meData.userPrincipalName;

    if (!senderEmail) {
      throw new Error('Unable to determine sender email from Microsoft Graph API');
    }

    console.log(`Sender email resolved: ${senderEmail}`);

    // Read the recent_issues.json file to get the latest issue data
    const rawData = fs.readFileSync('recent_issues.json');
    const issueData = JSON.parse(rawData);

    // Check if there are any issues
    if (!issueData.items || issueData.items.length === 0) {
      throw new Error('No issues found.');
    }

    // Prepare the email content with issue names
    const issueNames = issueData.items.map(issue => issue.title).join('\n');
    const emailContent = `New task available:\n\n${issueNames}`;

    // Construct the email payload
    const emailPayload = {
      message: {
        subject: 'New task available',
        body: {
          contentType: 'Text',
          content: emailContent
        },
        toRecipients: [
          {
            emailAddress: {
              address: email
            }
          }
        ],
        from: {
          emailAddress: {
            address: senderEmail // Dynamically fetched email
          }
        }
      },
      saveToSentItems: 'true'
    };

    // Send email using Outlook API
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${outlookService.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send email: ${errorData}`);
    }

    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
}

module.exports = { AonNewPullRequest, RaddTaskToNotion, AonNewIssue, RsendEmail };
