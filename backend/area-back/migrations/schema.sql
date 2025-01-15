DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS user_services CASCADE;
DROP TABLE IF EXISTS discord_servers CASCADE;
DROP TABLE IF EXISTS discord_servers_members CASCADE;

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE actions (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);

CREATE TABLE reactions (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    required_service_id INT REFERENCES services(id) ON DELETE CASCADE,
    required_service_name TEXT NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    areas TEXT[] NULL,
    is_logged BOOLEAN NOT NULL,
    access_token TEXT NULL,
    refresh_token TEXT NULL
);

CREATE TABLE user_services (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id) ON DELETE CASCADE UNIQUE,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    is_logged BOOLEAN NOT NULL
);

CREATE TABLE discord_servers (
    id SERIAL PRIMARY KEY,
    server_id TEXT NOT NULL UNIQUE,
    server_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    reactions_id TEXT[]
);

CREATE TABLE discord_servers_members (
  id SERIAL PRIMARY KEY,
  server_id TEXT NOT NULL,
  server_name TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMP NOT NULL,
  reactions_id TEXT[],
  UNIQUE (server_id, user_name)
);

-- Insert services
INSERT INTO services (name) VALUES ('Spotify');
INSERT INTO services (name) VALUES ('YouTube');
INSERT INTO services (name) VALUES ('Netflix');
INSERT INTO services (name) VALUES ('Twitch');
INSERT INTO services (name) VALUES ('Twitter');
INSERT INTO services (name) VALUES ('Github');
INSERT INTO services (name) VALUES ('Discord');
INSERT INTO services (name) VALUES ('Google');
INSERT INTO services (name) VALUES ('Notion');
INSERT INTO services (name) VALUES ('Outlook');

-- Insert actions
INSERT INTO actions (service_id, description) VALUES (2, 'Like a video');
INSERT INTO actions (service_id, description) VALUES (2, 'New video uploaded');
INSERT INTO actions (service_id, description) VALUES (6, 'New pull request created');
INSERT INTO actions (service_id, description) VALUES (6, 'New issue created');
INSERT INTO actions (service_id, description) VALUES (1, 'New song added to a playlist');
INSERT INTO actions (service_id, description) VALUES (1, 'New album released by a favorite artist');
INSERT INTO actions (service_id, description) VALUES (5, 'New tweet liked');
INSERT INTO actions (service_id, description) VALUES (5, 'When Following a user');
INSERT INTO actions (service_id, description) VALUES (7, 'New server created');
INSERT INTO actions (service_id, description) VALUES (7, 'New member in server');

-- Insert reactions
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (2, 'Add songs from videos you liked to a Spotify playlist named Youtube', 1, 'Spotify');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (2, 'Tweet on X the video you liked', 5, 'Twitter');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (6, 'Add a task on Notion', 9, 'Notion');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (6, 'Send an email on Outlook to notify', 10, 'Outlook');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (1, 'Share the song on Twitter', 5, 'Twitter');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (1, 'Post a tweet with the album link', 5, 'Twitter');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (5, 'Create a Google Calendar with the tweet link', 8, 'Google');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (5, 'Search for the user and follow him on YouTube', 2, 'YouTube');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (7, 'Send an email to notify about new friend', 10, 'Outlook');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (7, 'Create a repository after creating a Discord server', 6, 'Github');
INSERT INTO reactions (service_id, description, required_service_id, required_service_name) VALUES (7, 'Follow a user after they joined a Discord server', 6, 'Github');
