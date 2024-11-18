DROP TABLE IF EXISTS users;
CREATE TABLE users (
    userid SERIAL PRIMARY KEY,
    username VARCHAR(50),
    password CHAR(60) NOT NULL
);

DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    review_text TEXT NOT NULL,
    -- reviewer_id INT NOT NULL,
    reviewer_name VARCHAR(50) NOT NULL,
    rating INT NOT NULL,
    user_reviewed TEXT NOT NULL
);
   
CREATE TABLE messages (
    reciever_name VARCHAR(50),
    title VARCHAR(50),
    message_text TEXT NOT NULL,
    PRIMARY KEY (reciever_name, title)
);


DROP TABLE IF EXISTS bounty;
CREATE TABLE bounty (
    userid SERIAL PRIMARY KEY,
    itemName VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);
