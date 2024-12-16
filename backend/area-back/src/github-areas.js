const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();
const GITHUB_API_URL = 'https://api.github.com';

// Function to fetch repositories from GitHub and store them
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

// Function to compare fetched and stored repositories
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

const AonRepoCreation = async (storedRepos) => {
  const fetchedRepos = await fetchRepositories(process.env.GITHUB_ACCESS_TOKEN);

  const newRepos = fetchedRepos.filter(fetchedRepo => {
    // Check if the repository is new (i.e., not in storedRepos)
    return !storedRepos.includes(fetchedRepo);
  });

  console.log('New Repositories:', newRepos);

  return { newRepos };
};

const AonRepoDeletion = async (storedRepos) => {
  const fetchedRepos = await fetchRepositories(process.env.GITHUB_ACCESS_TOKEN);

  const removedRepos = storedRepos.filter(storedRepo => {
    // Check if the repository was removed (i.e., not in fetchedRepos)
    return !fetchedRepos.includes(storedRepo);
  });

  console.log('Removed Repositories:', removedRepos);

  return { removedRepos };
};

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

// Function to read repository details from a file
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

async function RfollowUser(githubToken, targetUsername) {
  try {
    // Check if the user exists by querying their profile
    const userExists = await checkUserExists(targetUsername, githubToken);
    
    if (!userExists) {
      console.log(`User ${targetUsername} does not exist.`);
      return;
    }
    
    // If the user exists, follow them
    await followUser(targetUsername, githubToken);
    console.log(`Successfully followed ${targetUsername}`);
    
  } catch (error) {
    console.error('Error following user:', error.message);
  }
}

// Function to check if a user exists on GitHub
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

// Function to follow a user
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

async function RfollowUsersFromFile(githubToken) {
  const usernames = await readUsernamesFromFile('./src/users_to_follow.txt');  // Read usernames from file
  console.log('Usernames to follow:', usernames);
  for (const username of usernames) {
    await RfollowUser(githubToken, username);
  }
}

// Function to read usernames from a file
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


module.exports = {
  fetchRepositories,
  compareRepositories,
  AonRepoCreation,
  AonRepoDeletion,
  RcreateRepo,
  RfollowUser,
  RfollowUsersFromFile
};