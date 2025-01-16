const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// Submit a new contact response
router.post('/', async (req, res) => {
  const { firstName, lastName, email, region, category, description } = req.body;

  const connection = await pool.getConnection(); // Start a transaction
  try {
    await connection.beginTransaction();

    // Insert into contacts table
    const [result] = await connection.query(
      `INSERT INTO contacts (first_name, last_name, email, region_id, category_id, description)
       VALUES (?, ?, ?, (SELECT id FROM regions WHERE name = ?), (SELECT id FROM categories WHERE name = ?), ?)`,
      [firstName, lastName, email, region, category, description]
    );

    const contactId = result.insertId;

    // Insert into contact_log table with default "Pending" status
    await connection.query(
      `INSERT INTO contact_log (contact_id, action) VALUES (?, ?)`,
      [contactId, 'Pending']
    );

    await connection.commit(); // Commit the transaction
    res.status(201).json({ message: 'Contact submitted successfully', id: contactId });
  } catch (err) {
    await connection.rollback(); // Roll back the transaction on error
    console.error(err);
    res.status(500).send('Error submitting contact');
  } finally {
    connection.release(); // Release the connection back to the pool
  }
});

// Fetch contacts with filtering
router.get('/', async (req, res) => {
  const { region, category } = req.query;
  try {
    let query = `
      SELECT c.id, c.first_name, c.last_name, c.email, r.name AS region, cat.name AS category, c.description, c.created_at
      FROM contacts c
      JOIN regions r ON c.region_id = r.id
      JOIN categories cat ON c.category_id = cat.id
      WHERE 1 = 1
    `;
    const params = [];

    if (region) {
      query += ' AND r.name = ?';
      params.push(region);
    }
    if (category) {
      query += ' AND cat.name = ?';
      params.push(category);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching contacts');
  }
});

module.exports = router;
