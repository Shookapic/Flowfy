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

INSERT INTO services (name) VALUES ('Spotify');
INSERT INTO services (name) VALUES ('YouTube');
INSERT INTO services (name) VALUES ('Netflix');
INSERT INTO services (name) VALUES ('Twitch');
INSERT INTO services (name) VALUES ('Twitter');
INSERT INTO services (name) VALUES ('Github');
-- YOUTUBE AREAS
INSERT INTO actions (service_id, description) VALUES (2, 'On Like');
INSERT INTO actions (service_id, description) VALUES (2, 'On Subscribe');
INSERT INTO reactions (service_id, description) VALUES (2, 'Subscribe to channel');
INSERT INTO reactions (service_id, description) VALUES (2, 'Unsubscribe to channel');
INSERT INTO reactions (service_id, description) VALUES (2, 'Like 3 latest videos from subscribed channels');
-- GITHUB AREAS
INSERT INTO actions (service_id, description) VALUES (6, 'On Repo Creation');
INSERT INTO actions (service_id, description) VALUES (6, 'On Repo Deletion');
INSERT INTO reactions (service_id, description) VALUES (6, 'Repo Creation');
INSERT INTO reactions (service_id, description) VALUES (6, 'Follow user');