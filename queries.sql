CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    book_name VARCHAR(100),
    author VARCHAR(100),
    rating INT(2),
    review VARCHAR(1000),
    cover_id VARCHAR(15)
)