CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(8),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
    context TEXT,
    created_at TIMESTAMP
);