# Flowfy

Welcome to the Flowfy repository! Flowfy is a Zapier alternative.

## Deployment using Docker Compose

To deploy the project using Docker Compose, follow these steps:

1. **Clone the repository**:
    ```bash
    git clone https://github.com/Shookapic/Flowfy.git
    cd Flowfy
    ```

2. **Create a `.env` file**:
    Create a `.env` file in the root directory of the project and add your environment variables. Here is an example:
    ```env
    # (repo root).env
    DB_HOST=your_db_host
    DB_PORT=your_db_port
    DB_USER=your_db_user
    DB_PASSWORD=your_db_user_password
    DB_DATABASE=your_db_name
    POSTGRES_USER=your_user_in_db_container
    POSTGRES_PASSWORD=your_db_user_password_in_container
    POSTGRES_DB=your_db_name_in_container
    ```

3. **Create a `.env` file in the `backend/area-back` directory**:
    Add the following environment variables to a new `.env` file in the `backend/area-back` directory:
    ```env
    DB_HOST=your_db_host
    DB_PORT=your_db_port
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_DATABASE=your_db_name
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    JWT_SECRET=your_jwt_secret
    SESSION_SECRET=your_session_secret
    TWITTER_BEARER_TOKEN=your_twitter_bearer_token
    TWITTER_CONSUMER_KEY=your_twitter_consumer_key
    TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret
    TWITTER_CLIENT_ID=your_twitter_client_id
    TWITTER_CLIENT_SECRET=your_twitter_client_secret
    YOUTUBE_CLIENT_ID=your_youtube_client_id
    YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    REDDIT_CLIENT_ID=your_reddit_client_id
    REDDIT_CLIENT_SECRET=your_reddit_client_secret
    SPOTIFY_CLIENT_ID=your_spotify_client_id
    SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
    NOTION_CLIENT_ID=your_notion_client_id
    NOTION_CLIENT_SECRET=your_notion_client_secret
    NOTION_AUTHORIZATION_URL=your_notion_authorization_url
    OUTLOOK_CLIENT_ID=your_outlook_client_id
    OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
    NOTION_DATABASE_ID=your_notion_database_id
    DISCORD_CLIENT_ID=your_discord_client_id
    DISCORD_CLIENT_SECRET=your_discord_client_secret
    DISCORD_CALLBACK_URL=your_discord_callback_url
    DISCORD_BOT_TOKEN=your_discord_bot_token
    ```

4. **Build and run the containers**:
    Use Docker Compose to build and run the containers:
    ```bash
    (cd root repo)
    docker-compose up --build -d
    ```

5. **Access the application**:
    Once the containers are up and running, you can access the application at:
    - Frontend: [127.0.0.1:8080](http://localhost:8080)
    - Backend Documentation: [127.0.0.1:3000](http://localhost:3000)

## Stopping the containers

To stop the running containers, use the following command:
```bash
docker-compose down --volumes --remove-orphans
```

# Our app is accessible at [Flowfy](https://flowfy.duckdns.org) and the documentation is accessible at [Flowfy DOC](https://flowfy.duckdns.org/api/docs)
