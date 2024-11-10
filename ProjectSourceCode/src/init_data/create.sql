CREATE TABLE users (
    userid SERIAL PRIMARY KEY,
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    review_text TEXT NOT NULL,
    review_by INT NOT NULL,
    rating INT NOT NULL,
    user_reviewed TEXT NOT NULL
);
   
CREATE TABLE messages (
    reciever_name VARCHAR(50),
    title VARCHAR(50),
    message_text TEXT NOT NULL,
    PRIMARY KEY (reciever_name, title)
);
