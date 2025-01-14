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

  } catch (error) {
    console.error('Error fetching pull requests:', error.response ? error.response.data : error.message);
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
    const notionDatabaseId = "17bc1900f49980099436fac478d94086";

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

module.exports = { AonNewPullRequest, RaddTaskToNotion };
