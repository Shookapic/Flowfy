DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS user_services CASCADE;

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
    description TEXT NOT NULL
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

-- Insert services
INSERT INTO services (name) VALUES ('Spotify');
INSERT INTO services (name) VALUES ('YouTube');
INSERT INTO services (name) VALUES ('Netflix');
INSERT INTO services (name) VALUES ('Twitch');
INSERT INTO services (name) VALUES ('Twitter');
INSERT INTO services (name) VALUES ('Github');
INSERT INTO services (name) VALUES ('Discord');

-- Insert actions
INSERT INTO actions (service_id, description) VALUES (2, 'Like a video');
INSERT INTO actions (service_id, description) VALUES (2, 'New video uploaded');
INSERT INTO actions (service_id, description) VALUES (6, 'New pull request created');
INSERT INTO actions (service_id, description) VALUES (6, 'New issue created');
INSERT INTO actions (service_id, description) VALUES (1, 'New song added to a playlist');
INSERT INTO actions (service_id, description) VALUES (1, 'New album released by a favorite artist');
INSERT INTO actions (service_id, description) VALUES (5, 'New tweet liked');
INSERT INTO actions (service_id, description) VALUES (5, 'When Following a user');
INSERT INTO actions (service_id, description) VALUES (7, 'New friend added');

-- Insert reactions
INSERT INTO reactions (service_id, description) VALUES (2, 'Add songs from videos you liked to a Spotify playlist named Youtube');
INSERT INTO reactions (service_id, description) VALUES (2, 'Tweet on X the video you liked');
INSERT INTO reactions (service_id, description) VALUES (6, 'Add a task on Google Calendar for the new pull request');
INSERT INTO reactions (service_id, description) VALUES (6, 'Add a task on Google Calendar for the new issue');
INSERT INTO reactions (service_id, description) VALUES (1, 'Share the song on Twitter');
INSERT INTO reactions (service_id, description) VALUES (1, 'Post a tweet with the album link');
INSERT INTO reactions (service_id, description) VALUES (5, 'Create a Google Calendar with the tweet link');
INSERT INTO reactions (service_id, description) VALUES (5, 'Search for the user and follow him on YouTube');
INSERT INTO reactions (service_id, description) VALUES (7, 'Send an email to notify about new friend');