-- Create the Services table
CREATE TABLE Services (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-incremented ID for the service
    name TEXT UNIQUE NOT NULL             -- Name of the service, unique and cannot be null
);

-- Create the Actions table
CREATE TABLE Actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-incremented ID for the action
    service_id INTEGER NOT NULL,          -- Foreign key to Services table
    name TEXT NOT NULL,                   -- Name of the action
    FOREIGN KEY (service_id) REFERENCES Services(id)  -- Foreign key constraint
);

-- Create the Reactions table
CREATE TABLE Reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-incremented ID for the reaction
    service_id INTEGER NOT NULL,          -- Foreign key to Services table
    name TEXT NOT NULL,                   -- Name of the reaction
    FOREIGN KEY (service_id) REFERENCES Services(id)  -- Foreign key constraint
);

-- Create the ActionReactions table
CREATE TABLE ActionReactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-incremented ID for the relation
    action_id INTEGER NOT NULL,           -- Foreign key to Actions table
    reaction_id INTEGER NOT NULL,         -- Foreign key to Reactions table
    FOREIGN KEY (action_id) REFERENCES Actions(id) ON DELETE CASCADE, -- Foreign key constraint
    FOREIGN KEY (reaction_id) REFERENCES Reactions(id) ON DELETE CASCADE -- Foreign key constraint
);
