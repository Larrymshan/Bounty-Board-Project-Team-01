CREATE TABLE users (
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
