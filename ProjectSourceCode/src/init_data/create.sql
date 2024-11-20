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
