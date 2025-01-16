require('dotenv').config(); // Load environment variables

const express = require('express');
const pool = require('../db/connection');
const nodemailer = require('nodemailer');
const router = express.Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service provider
  auth: {
    user: process.env.EMAIL, // Email from environment variables
    pass: process.env.EMAIL_PASSWORD, // App password from environment variables
  },
});

// Log an action for a contact (POST)
router.post('/', async (req, res) => {
  const { contactId, action } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO contact_log (contact_id, action) VALUES (?, ?)`,
      [contactId, action]
    );
    res.status(201).json({ message: 'Action logged successfully', id: result.insertId });
  } catch (err) {
    console.error('Error logging action:', err);
    res.status(500).send('Error logging action');
  }
});

// Get the latest status of records (GET)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cl.id, cl.contact_id, cl.action, cl.timestamp, c.first_name, c.last_name, c.description
      FROM contact_log cl
      JOIN contacts c ON cl.contact_id = c.id
      WHERE cl.timestamp = (
        SELECT MAX(timestamp)
        FROM contact_log
        WHERE contact_id = cl.contact_id
      )
      ORDER BY cl.timestamp DESC;
    `);

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching contact logs:', err);
    res.status(500).send('Error fetching contact logs');
  }
});

// Fetch contact details by contactId (GET)
router.get('/contact/:contactId', async (req, res) => {
  const { contactId } = req.params;
  try {
    // Query to fetch the contact details
    const [contact] = await pool.query(
      `
      SELECT c.first_name, c.last_name, c.email, c.description
      FROM contacts c
      WHERE c.id = ?
      `,
      [contactId]
    );

    if (contact.length === 0) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(200).json(contact[0]);
  } catch (err) {
    console.error('Error fetching contact details:', err);
    res.status(500).send('Error fetching contact details');
  }
});

// Send email and mark query as resolved (POST)
router.post('/send-email', async (req, res) => {
  const { contactId, message } = req.body;

  try {
    // Fetch the contact's details, including the email and category
    const [contact] = await pool.query(
      `
      SELECT c.email, c.first_name, c.last_name, cat.name AS category
      FROM contacts c
      JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = ?
      `,
      [contactId]
    );

    if (contact.length === 0) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const { email, first_name, last_name, category } = contact[0];

    // Construct the subject line dynamically
    const subject = `Response to your query regarding ${category}`;

    // Send the email using Nodemailer
    await transporter.sendMail({
      from: process.env.EMAIL, // Sender email
      to: email, // Recipient email fetched from the database
      subject,
      text: message,
    });

    // Log the "Resolved" action in the contact_log table
    await pool.query(`INSERT INTO contact_log (contact_id, action) VALUES (?, ?)`, [
      contactId,
      'Resolved',
    ]);

    res.status(200).json({ message: 'Email sent and query marked as resolved' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending email', error });
  }
});

module.exports = router;
