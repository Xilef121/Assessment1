// backend/index.js

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.get('/contacts/recent-messages', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;

        const searchValue = req.query.searchValue || '';
        const searchField = req.query.searchField?.toLowerCase();
        const searchPattern = `%${searchValue}%`;

        let query = '';
        let values = [];

        // 🔍 IF FILTERING IS USED
        if (searchValue && searchField) {
        let whereClause = '';
        switch (searchField) {
            case 'message':
            whereClause = `WHERE sub.content ILIKE $1`;
            break;
            case 'name':
            whereClause = `WHERE sub.contact_name ILIKE $1`;
            break;
            case 'phone':
            whereClause = `WHERE sub.phone_number ILIKE $1`;
            break;
            default:
            return res.status(400).json({ error: 'Invalid searchField. Use "name", "phone", or "message".' });
        }

        query = `
            SELECT *
            FROM (
            SELECT DISTINCT ON (m.contact_id)
                m.id AS message_id,
                m.contact_id,
                c.phone_number,
                c.contact_name,
                m.content,
                m.created_at
            FROM messages m
            JOIN contacts c ON m.contact_id = c.id
            ORDER BY m.contact_id, m.created_at DESC
            ) sub
            ${whereClause}
            ORDER BY sub.created_at DESC
            LIMIT $2 OFFSET $3;
        `;
        values = [searchPattern, limit, offset];

        } else {
        // ⚡ NO FILTER — USE FAST VERSION
        query = `
            SELECT DISTINCT ON (m.contact_id)
            m.id AS message_id,
            m.contact_id,
            c.phone_number,
            c.contact_name,
            m.content,
            m.created_at
            FROM messages m
            JOIN contacts c ON m.contact_id = c.id
            ORDER BY m.contact_id, m.created_at DESC
            LIMIT $1 OFFSET $2;
        `;
        values = [limit, offset];
        }

        const { rows } = await pool.query(query, values);
        res.json(rows);
  
    } catch (err) {
      console.error('Error in /contacts/recent-messages:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
  
  

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
