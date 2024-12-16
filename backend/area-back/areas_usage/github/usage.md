# Usage Guide

## Functions Overview

### `RcreateRepo`

The `RcreateRepo` function is responsible for creating a repository. To use this reaction, you need to provide a configuration file with specific details.

#### Configuration File Requirements

- **File Name**: `repos_to_create.txt`
- **Location**: `backend/area-back/src/`
- **File Format**: txt
- **Required Fields (all on the same line)**:
  - `repo_name`: The name of the repository.
  - `description`: A brief description of the repository.
  - `private`: A boolean indicating if the repository is private.

#### Example `repos_to_create.txt`

```txt
name: test, description: test area, private: true
name: AREA, description: BEST TEK3 PROJECT, private: false
```

---

### `RfollowUsersFromFile`

The `RfollowUsersFromFile` function is responsible for following users on GitHub. To use this reaction, you need to provide a configuration file with specific details.

#### Configuration File Requirements

- **File Name**: `users_to_follow.txt`
- **Location**: `backend/area-back/src/`
- **File Format**: txt
- **Required Fields**:
  - `username`: GitHub username.

#### Example `users_to_follow.txt`

```txt
HelifeWasTaken
z0ubi
```