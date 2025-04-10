require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

function generatePhoneNumber() {
    const firstDigit = Math.random() < 0.5 ? '8' : '9';
    let phoneNumber = firstDigit;
    for (let i = 0; i < 7; i++) {
        phoneNumber += Math.floor(Math.random() * 10);
    }
    return phoneNumber;
}

async function generateUniquePhoneNumbers(count) {
    const phoneNumbers = new Set();
    while (phoneNumbers.size < count) {
        const newNumber = generatePhoneNumber();
        phoneNumbers.add(newNumber);
    }
    return Array.from(phoneNumbers);
}

async function readCsvData(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv({ headers: ['messages'] }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

function randomTimestamp(startDate, endDate) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const randomTime = Math.floor(Math.random() * (end - start)) + start;
    return new Date(randomTime);
}

function generateRandomName() {
    const firstNames = [
      'Alex', 'Jamie', 'Taylor', 'Jordan', 'Morgan', 'Sam', 'Casey', 'Jessie', 'Avery', 'Riley',
      'Chris', 'Pat', 'Lee', 'Robin', 'Charlie', 'Drew', 'Devon', 'Skyler', 'Rowan', 'Quinn'
    ];
  
    const lastNames = [
      'Smith', 'Johnson', 'Lee', 'Brown', 'Williams', 'Taylor', 'Jones', 'Garcia', 'Martinez', 'Davis',
      'Clark', 'Walker', 'Lewis', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill'
    ];
  
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
}

async function seedData() {
    try {
        const filePath = path.join(__dirname, '..', 'data', 'message_content.csv');
        const messageContents = await readCsvData(filePath);

        const fixedTimestamp = new Date('2020-01-01T00:00:00');
        const totalContacts = 100000;
        const uniquePhoneNumbers = await generateUniquePhoneNumbers(totalContacts);
        const contacts = uniquePhoneNumbers.map((phone) => ({
            phone_number: phone,
            contact_name: generateRandomName(),
            created_at: fixedTimestamp,
            updated_at: fixedTimestamp,
        }));

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const batchSizeContacts = 1000;
            for (let i = 0; i < contacts.length; i += batchSizeContacts) {
                const batch = contacts.slice(i, i + batchSizeContacts);
                const valueRows = batch
                    .map((_, idx) => `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`)
                    .join(',');
                    const flatValues = batch.flatMap(contact => [
                        contact.phone_number,
                        contact.contact_name,
                        contact.created_at,
                        contact.updated_at,
                    ]);
                await client.query(
                    `INSERT INTO contacts (phone_number, contact_name, created_at, updated_at) VALUES ${valueRows}`,
                    flatValues
                );
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
        
        const { rows: contactRows } = await pool.query('SELECT id FROM contacts');
        const contactIds = contactRows.map(row => row.id);
        console.log(`Retrieved ${contactIds.length} contact IDs.`);

        const totalMessages = 5000000;
        const batchSizeMessages = 1000;
        for (let i = 0; i < totalMessages; i += batchSizeMessages) {
            const messagesBatch = [];
            for (let j = 0; j < batchSizeMessages && (i + j) < totalMessages; j++) {
                const randomContactId = contactIds[Math.floor(Math.random() * contactIds.length)];
                const messageTimestamp = randomTimestamp(fixedTimestamp, new Date());
                const randomMessageData = messageContents[Math.floor(Math.random() * messageContents.length)];
                const content = randomMessageData.messages || `Default message content`;
                messagesBatch.push({
                    contact_id: randomContactId,
                    content,
                    created_at: messageTimestamp,
                });
            }

            const valueRows = messagesBatch
                .map((_, idx) => `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`)
                .join(',');
            const flatValues = messagesBatch.flatMap(msg => [
                msg.contact_id,
                msg.content,
                msg.created_at,
            ]);
            await pool.query(
                `INSERT INTO messages (contact_id, content, created_at) VALUES ${valueRows}`,
                flatValues
            );

            if ((i + batchSizeMessages) % (batchSizeMessages * 10) === 0) {
                console.log(`Inserted ${i + batchSizeMessages} messages...`);
            }
        }
        console.log('Messages inserted.');

        console.log('Creating indexes...')
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_contact_id_created_at ON messages(contact_id, created_at DESC);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_contacts_contact_name ON contacts(contact_name);`);
        console.log('Indexes created')
        pool.end();
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seedData()