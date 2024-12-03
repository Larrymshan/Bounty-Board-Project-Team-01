DROP TABLE IF EXISTS users;
CREATE TABLE users (
    userid SERIAL PRIMARY KEY,
    username VARCHAR(50),
    password CHAR(60) NOT NULL
    );

DROP TABLE IF EXISTS profiles;
CREATE TABLE profiles(

    profile_id SERIAL PRIMARY KEY,
    userid INT UNIQUE,
    first_name VARCHAR(60),
    last_name VARCHAR(60),
    profile_bio TEXT,
    profile_picture_url TEXT,
    CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
    
    -- should add a history of things done or resume?
    -- I will figure out what intails profile tommorow
);

DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    review_text TEXT NOT NULL,
    -- reviewer_id INT NOT NULL,
    reviewer_name VARCHAR(50) NOT NULL,
    rating INT NOT NULL,
    user_reviewed TEXT NOT NULL,
    flagged BOOLEAN DEFAULT FALSE
);
   
CREATE TABLE messages (
    reciever_name VARCHAR(50),
    sender_name VARCHAR(50),
    title VARCHAR(50),
    message_text TEXT NOT NULL,
    PRIMARY KEY (reciever_name, title)
);

DROP TABLE IF EXISTS Bounty;
CREATE TABLE Bounty (
    BountyID SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    job_description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    poster VARCHAR(50) NOT NULL,
    is_taken BOOLEAN DEFAULT FALSE
);

CREATE TABLE Accounts (
    account_id SERIAL PRIMARY KEY,       -- Unique ID for the account
    userid INT NOT NULL,                -- Links to the Users table
    balance NUMERIC(10, 2) NOT NULL DEFAULT 100, -- Current balance (money)
    FOREIGN KEY (userid) REFERENCES users(userid) -- Foreign key constraint
);

CREATE TABLE Transactions (
    transaction_id SERIAL PRIMARY KEY,  -- Unique ID for each transaction
    account_id INT NOT NULL,            -- Links to the Accounts table
    transaction_type VARCHAR(50) NOT NULL, -- e.g., "deposit", "withdrawal", "transfer"
    amount NUMERIC(10, 2) NOT NULL,     -- Amount of money involved
    FOREIGN KEY (account_id) REFERENCES Accounts(account_id) -- Foreign key constraint
);