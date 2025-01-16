const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// Fetch all regions
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM regions');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching regions:', err);
    res.status(500).send('Error fetching regions');
  }
});

// Add a new region
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('Region name is required');
  }

  try {
    const [result] = await pool.query('INSERT INTO regions (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    console.error('Error adding region:', err);
    res.status(500).send('Error adding region');
  }
});

// Update a region
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).send('Region name is required');
  }

  try {
    const [result] = await pool.query('UPDATE regions SET name = ? WHERE id = ?', [name, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Region not found');
    }
    res.status(200).json({ id, name });
  } catch (err) {
    console.error('Error updating region:', err);
    res.status(500).send('Error updating region');
  }
});

// Delete a region
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM regions WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Region not found');
    }
    res.status(200).send('Region deleted successfully');
  } catch (err) {
    console.error('Error deleting region:', err);
    res.status(500).send('Error deleting region');
  }
});

module.exports = router;
