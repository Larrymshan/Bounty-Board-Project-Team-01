CREATE TABLE users (
    userid SERIAL PRIMARY KEY,
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    review_text TEXT NOT NULL,
    -- reviewer_id INT NOT NULL,
    reviewer_name INT NOT NULL,
    rating INT NOT NULL,
    -- need to add user_id column for users table
    -- FOREIGN KEY (reviewer_id) REFERENCES users(user_id),
);

CREATE TABLE messages (
    reciever_name VARCHAR(50),
    title VARCHAR(50),
    message_text TEXT NOT NULL,
    PRIMARY KEY (reciever_name, title)
);
