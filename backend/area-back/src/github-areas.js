/**
 * @file github-areas.js
 * @description Module for interacting with GitHub API to manage repositories and follow users.
 */

const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();
const GITHUB_API_URL = 'https://api.github.com';
const {addReactionIdToServer, fetchFilteredServers, fetchFilteredMembers, addReactionIdToMember } = require('./crud_discord_queries');
const {getAccessTokenByEmailAndServiceName} = require('./crud_user_services');

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
    console.error('Error fetching repositories:', error.response?.data || error.message);
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
 * Checks for new repository creations.
 * @async
 * @function AonRepoCreation
 * @param {Array<string>} storedRepos - The stored repository full names.
 * @returns {Promise<Object>} A promise that resolves with an object containing new repositories.
 */
const AonRepoCreation = async (storedRepos) => {
  const fetchedRepos = await fetchRepositories(process.env.GITHUB_ACCESS_TOKEN);

  const newRepos = fetchedRepos.filter(fetchedRepo => {
    // Check if the repository is new (i.e., not in storedRepos)
    return !storedRepos.includes(fetchedRepo);
  });

  console.log('New Repositories:', newRepos);

  return { newRepos };
};

/**
 * Checks for repository deletions.
 * @async
 * @function AonRepoDeletion
 * @param {Array<string>} storedRepos - The stored repository full names.
 * @returns {Promise<Object>} A promise that resolves with an object containing removed repositories.
 */
const AonRepoDeletion = async (storedRepos) => {
  const fetchedRepos = await fetchRepositories(process.env.GITHUB_ACCESS_TOKEN);

  const removedRepos = storedRepos.filter(storedRepo => {
    // Check if the repository was removed (i.e., not in fetchedRepos)
    return !fetchedRepos.includes(storedRepo);
  });

  console.log('Removed Repositories:', removedRepos);

  return { removedRepos };
};

/**
 * Reads repository details from a file.
 * @async
 * @function readReposFromFile
 * @param {string} filePath - The path to the file containing repository details.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of repository objects.
 */
async function readReposFromFile(filePath) {
  // Check if the file exists, if not create it
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf8');
    console.log(`File created: ${filePath}`);
  }

  const repos = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const match = line.match(/name: (.+), description: (.*), private: (true|false)/);
    if (match) {
      repos.push({
        name: match[1],
        description: match[2] || '',
        private: match[3] === 'true', // Convert "true"/"false" to booleans
      });
    }
  }

  return repos;
}

/**
 * Follows a user on GitHub.
 * @async
 * @function followUser
 * @param {string} username - The username of the user to follow.
 * @param {string} githubToken - The GitHub access token.
 */
async function followUser(username, githubToken) {
  try {
    await axios.put(
      `${GITHUB_API_URL}/user/following/${username}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      }
    );
  } catch (error) {
    console.error(`Error following user: ${username}`, error.response?.data || error.message);
    throw new Error(`Error following ${username}`);
  }
}

/**
 * Follows users from a file.
 * @async
 * @function RfollowUsersFromFile
 * @param {string} githubToken - The GitHub access token.
 */
async function RfollowUsersFromFile(githubToken) {
  const usernames = await readUsernamesFromFile('./src/users_to_follow.txt');  // Read usernames from file
  console.log('Usernames to follow:', usernames);
  for (const username of usernames) {
    await RfollowUser(githubToken, username);
  }
}

/**
 * Reads usernames from a file.
 * @async
 * @function readUsernamesFromFile
 * @param {string} filePath - The path to the file containing usernames.
 * @returns {Promise<Array<string>>} A promise that resolves with an array of usernames.
 */
async function readUsernamesFromFile(filePath) {
  // Check if the file exists, if not create it
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf8');
    console.log(`File created: ${filePath}`);
  }

  const usernames = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    usernames.push(line.trim());
  }

  return usernames;
}

/**
 * Creates repositories on GitHub based on a configuration file.
 * @async
 * @function RcreateRepo
 * @param {string} githubToken - The GitHub access token.
 */
async function RcreateRepo(githubToken) {
  try {
    // Read repository details from a file
    const reposToCreate = await readReposFromFile('./src/repos_to_create.txt');
    console.log('Repositories to create:', reposToCreate);

    // Create each repository on GitHub
    for (const repo of reposToCreate) {
      try {
        await axios.post(
          `${GITHUB_API_URL}/user/repos`,
          {
            name: repo.name,
            description: repo.description || '',
            private: repo.private, // Use the parsed value directly
          },
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`Repository created: ${repo.name}`);
      } catch (error) {
        if (error.response?.status === 422) {
          console.log(`Repository already exists: ${repo.name}`);
        } else {
          console.error(`Error creating repository: ${repo.name}`, error.response?.data || error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error creating repositories:', error);
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
    const ownedServers = await fetchFilteredServers('10');
    if (!ownedServers) {
      throw new Error('No Server found.');
    }

    for (const server of ownedServers) {
      // Define the repository name and settings
      const repoData = {
        name: server.server_name.replace(/\s+/g, '-').toLowerCase(), // Convert spaces to dashes for repo name
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
      const repoName = response.data.name;
      const owner = response.data.owner.login;

      console.log(`Repository created for server ${server.server_name}: ${repoUrl}`);
      addReactionIdToServer(server.server_id, 10);

      // Add a basic README.md file
      const readmeContent = `# ${server.server_name}\n\nThis repository is for the Discord server: ${server.server_name}.`;

      await axios.put(
        `${GITHUB_API_URL}/repos/${owner}/${repoName}/contents/README.md`,
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
    }
  } catch (error) {
    console.error('Error creating repositories or adding README.md:', error);
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
    const members = await fetchFilteredMembers('11');
    if (!members) {
      throw new Error('No Server found.');
    }
    for (const member of members) {
      const userExists = await checkUserExists(member.user_name, githubAccessToken);
      addReactionIdToMember(member.user_name, member.server_id, '11');
      if (!userExists) {
        console.log(`User ${member.user_name} does not exist.`);
        continue;
      }
      console.log(`User ${member.user_name} does exist.`);
      // If the user exists, follow them
      try {
        await axios.put(
          `${GITHUB_API_URL}/user/following/${username}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
            },
          }
        );
      } catch (error) {
        console.error(`Error following user: ${username}`, error.response?.data || error.message);
        throw new Error(`Error following ${username}`);
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


module.exports = {
  fetchRepositories,
  compareRepositories,
  AonRepoCreation,
  AonRepoDeletion,
  RcreateRepo,
  RfollowNewServerMembers,
  RfollowUsersFromFile,
  RcreateRepositoryFromDiscordServers
};