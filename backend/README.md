# Backend Assessment

## Setup Instructions
1. Ensure that Node.js, npm, PostgreSQL are installed
2. Using `npm install`, install dependencies required
3. Create PostgreSQL database by using `CREATE DATABASE your_database_name;` in PostgreSQL shell.
4. In terminal, run `psql -U your_postgres_username -d your_database_name -a -f backend/db_setup.sql` (Replace `your_postgres_username` and `your_database_name`)
5. Create a `.env` file in the `backend` folder with your own environment variables for example:
   ```
   DB_USER=your_postgres_username
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   ```
6. Populate the database by running `npm run seed`

## Assumptions Made
- Message direction is abstracted away:
    * Assumed every message to a contact has a corresponding message from that contact, and vice versa. While this distinction is not explicitly implemented, it allows us to treat all messages as part of a single unified conversation for search and display purposes.
- Phone numbers follow Singapore's 8-digit format:
    * Contacts are assigned unique phone numbers that are 8 digits long, starting with either 8 or 9.
- Message timestamps can only occur after contact creation:
    * All messages are timestamped to occur at least after the contact's creation time to preserve logical consistency in the data.

## Query usage instructions

### Start the server

From the `backend` directory, run: `node index.js`

### Query Parameters

| Parameter    | Description                                       | Optional |
|--------------|---------------------------------------------------|----------| 
| `page`       | Page number (default = 1)                         | yes      |
| `searchField`| Field to filter by: `name`, `phone`, or `message` | yes      |
| `searchValue`| Search string to match                            | yes      |

### Examples
| Purpose                      | Example URL                                                                             |
|------------------------------|-----------------------------------------------------------------------------------------|
| Get recent messages (page 1) | `http://localhost:3000/contacts/recent-messages`                                        | 
| Get page 2                   | `http://localhost:3000/contacts/recent-messages?page=2`                                 |
| Search by contact name       | `http://localhost:3000/contacts/recent-messages?searchField=name&searchValue=alex`      |
| Search by phone number       | `http://localhost:3000/contacts/recent-messages?searchField=phone&searchValue=8123      |  
| Search by message content    | `http://localhost:3000/contacts/recent-messages?searchField=message&searchValue=flower` |

## Key Design Decisions
- Databse Schema Simplicity
    * Only added contact name to allow for searching using contact name while keeping everything else the same as schema provided.
- Data Generation
    * Phone numbers, names and timestamps were all randomly generated to have a realistic distribution of messages among contacts.
- Single-Field Search:
    * Designed the API to allow filtering by only one search field (name, phone, or message) at a time. This decision was made for simplicity and to ensure that each query remains manageable, even though it could be later extended to support multi-field filtering if needed.
- Performance vs. Flexibility Trade-offs:
    * By separating the unfiltered fast query from the filtered version, we ensure that the common case (no filter) is fast while still providing full search functionality when needed. This dual-path approach reflects our balance between performance.