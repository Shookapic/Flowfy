const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();
const GITHUB_API_URL = 'https://api.github.com';
const {getAccessTokenByEmailAndServiceName } = require('./crud_user_services');
const {addReactionIdToServer, fetchFilteredServers, fetchFilteredMembers, addReactionIdToMember } = require('./crud_discord_queries');

/**
 * Fetches repositories from GitHub and stores them.
 * @async
 * @function fetchRepositories
 * @param {string} accessToken - The GitHub access token.
 * @returns {Promise<Array<string>>} A promise that resolves with an array of repository full names.
 */
const fetchRepositories = async (accessToken) => {
  const url = 'https://api.github.com/user/repos';
  let page = 1;
  let allRepos = [];

  try {
    while (true) {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { per_page: 100, page },
      });

      const repos = response.data;
      if (repos.length === 0) break;

      allRepos = allRepos.concat(repos);
      page++;
    }

    // Store fetched repositories locally (in memory) with only full_name
    const storedRepositories = allRepos.map(repo => repo.full_name);

    console.log('Stored Repositories:', storedRepositories);
    return storedRepositories;
  } catch (error) {
    console.error('Error fetching pull requests:', error.response ? error.response.data : error.message);
  }
};

/**
 * Compares fetched and stored repositories.
 * @async
 * @function compareRepositories
 * @param {Array<string>} storedRepos - The stored repository full names.
 * @returns {Promise<Object>} A promise that resolves with an object containing new, removed, and fetched repositories.
 */
const compareRepositories = async (storedRepos) => {
  const fetchedRepos = await fetchRepositories(process.env.GITHUB_ACCESS_TOKEN);

  const newRepos = fetchedRepos.filter(fetchedRepo => {
    // Check if the repository is new (i.e., not in storedRepos)
    return !storedRepos.includes(fetchedRepo);
  });

  const removedRepos = storedRepos.filter(storedRepo => {
    // Check if the repository was removed (i.e., not in fetchedRepos)
    return !fetchedRepos.includes(storedRepo);
  });

  console.log('New Repositories:', newRepos);
  console.log('Removed Repositories:', removedRepos);

  return { newRepos, removedRepos, fetchedRepos };
};


/**
 * Checks if a user exists on GitHub.
 * @async
 * @function checkUserExists
 * @param {string} username - The username to check.
 * @param {string} githubToken - The GitHub access token.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating if the user exists.
 */
async function checkUserExists(username, githubToken) {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
    });
    return response.status === 200;  // Status 200 means user exists
  } catch (error) {
    if (error.response?.status === 404) {
      return false;  // User not found
    }
    throw new Error('Error checking user existence');
  }
}

/**
 * Create a repository on GitHub for each owned Discord server.
 * @param {string} email - The email of the user.
 * @param {Array} ownedServers - List of servers owned by the user.
 * @returns {Promise<void>}
 */
async function RcreateRepositoryFromDiscordServers(email) {
  try {
    // Retrieve the GitHub access token for the user

    const githubAccessToken = await getAccessTokenByEmailAndServiceName(email, 'Github');

    if (!githubAccessToken) {
      throw new Error('No GitHub access token found for this user.');
    }

    const ownedServers = await fetchFilteredServers('8');
    if (!ownedServers) {
      throw new Error('No Server found.');
    }

    for (const server of ownedServers) {
      try {
        // Define the repository name
        const repoName = server.server_name.replace(/\s+/g, '-').toLowerCase(); // Convert spaces to dashes for repo name
        console.log(`Handling server ${server.server_name}: repo is ${repoName}`);

        // Check if the repository already exists
        const repoExists = await checkIfRepoExists(githubAccessToken, repoName);
        if (repoExists) {
          console.log(`Repository already exists for server ${server.server_name}: ${repoName}`);
          await addReactionIdToServer(server.server_id, 'Create a repository after creating a Discord server');
          continue; // Skip to the next server
        }

        // Define repository settings
        const repoData = {
          name: repoName,
          description: `Repository for Discord server: ${server.server_name}`,
          private: true, // Set to `true` if you want the repo to be private
        };

        // Create the repository via GitHub API
        const response = await axios.post(
          `${GITHUB_API_URL}/user/repos`,
          {
            name: repoData.name,
            description: repoData.description || '',
            private: repoData.private,
          },
          {
            headers: {
              Authorization: `Bearer ${githubAccessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const repoUrl = response.data.html_url;
        const owner = response.data.owner.login;

        console.log(`Repository created for server ${server.server_name}: ${repoUrl}`);
        await addReactionIdToServer(server.server_id, 'Create a repository after creating a Discord server');

        // Add a basic README.md file
        const readmeContent = `# ${server.server_name}\n\nThis repository is for the Discord server: ${server.server_name}.`;

        await axios.put(
          `https://api.github.com//repos/${owner}/${repoName}/contents/README.md`,
          {
            message: 'Add initial README.md',
            content: Buffer.from(readmeContent).toString('base64'), // Encode content in base64
          },
          {
            headers: {
              Authorization: `Bearer ${githubAccessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`README.md added to repository ${repoName}`);
      } catch (innerError) {
        console.error(`Error handling server ${server.server_name}:`);
        // console.error(`Error handling server ${server.server_name}:`, innerError.message);
        continue;
      }
    }
  } catch (error) {
    console.error('Error creating repositories or adding README.md:', error.message);
    throw error; // Optional: Re-throw if you want to escalate the error further
  }
}

// Function to check if a repository exists
async function checkIfRepoExists(githubAccessToken, repoName) {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/user/repos`, {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        per_page: 100, // Adjust the number as needed to fetch more repos if necessary
      },
    });

    // Check if the repository name exists in the user's repositories
    return response.data.some((repo) => repo.name === repoName);
  } catch (error) {
    console.error('Error checking repository existence:', error);
    throw error;
  }
}

/**
 * Follows a user on GitHub.
 * @async
 * @function RfollowUser
 * @param {string} githubToken - The GitHub access token.
 * @param {string} targetUsername - The username of the user to follow.
 */
async function RfollowNewServerMembers(email) {
  try {
    const githubAccessToken = await getAccessTokenByEmailAndServiceName(email, 'Github');

    if (!githubAccessToken) {
      throw new Error('No GitHub access token found for this user.');
    }
    const members = await fetchFilteredMembers('9');
    if (!members) {
      throw new Error('No Server found.');
    }
    for (const member of members) {
      const userExists = await checkUserExists(member.user_name, githubAccessToken);
      await addReactionIdToMember(member.user_name, member.server_id, 'Follow a user after they joined a Discord server');
      if (!userExists) {
        console.log(`User ${member.user_name} does not exist.`);
        continue;
      }
      console.log(`User ${member.user_name} does exist.`);
      // If the user exists, follow them
      try {
        await axios.put(
          `https://api.github.com/user/following/${member.user_name}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${githubAccessToken}`,
            },
          }
        );
        console.log(`following User ${member.user_name}.`);
      } catch (error) {
        console.error(`Error following user: ${member.user_name}`,  error);
        throw new Error(`Error following ${member.user_name}`);
      }
    }


  } catch (error) {
    console.error('Error following user:', error.message);
  }
}

/**
 * Checks if a user exists on GitHub.
 * @async
 * @function checkUserExists
 * @param {string} username - The username to check.
 * @param {string} githubToken - The GitHub access token.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating if the user exists.
 */
async function checkUserExists(username, githubToken) {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/users/${username}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
    });
    return response.status === 200;  // Status 200 means user exists
  } catch (error) {
    if (error.response?.status === 404) {
      return false;  // User not found
    }
    throw new Error('Error checking user existence');
  }
}

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

    const newContent = JSON.stringify(pullRequestResponse.data, null, 2);

    // Check if the file exists and read its content
    if (fs.existsSync('recent_pull_requests.json')) {
      const currentContent = fs.readFileSync('recent_pull_requests.json', 'utf-8');
      if (currentContent === newContent) {
        console.log('No changes detected in recent pull requests.');
        return null;
      }

      // Create a backup of the current file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync('recent_pull_requests.json', `backup_recent_pull_requests_${timestamp}.json`);
      console.log('Backup of recent pull requests created.');
    }

    // Write the new content to the file
    fs.writeFileSync('recent_pull_requests.json', newContent);
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

    const newContent = JSON.stringify(issueResponse.data, null, 2);

    // Check if the file exists and read its content
    if (fs.existsSync('recent_issues.json')) {
      const currentContent = fs.readFileSync('recent_issues.json', 'utf-8');
      if (currentContent === newContent) {
        console.log('No changes detected in recent issues.');
        return null;
      }

      // Create a backup of the current file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync('recent_issues.json', `backup_recent_issues_${timestamp}.json`);
      console.log('Backup of recent issues created.');
    }

    // Write the new content to the file
    fs.writeFileSync('recent_issues.json', newContent);
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

module.exports = {
  fetchRepositories,
  compareRepositories,
  RfollowNewServerMembers,
  RcreateRepositoryFromDiscordServers,
  AonNewPullRequest, RaddTaskToNotion, AonNewIssue, RsendEmail
};