const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Routes
const regionRoutes = require('./routes/regions');
const categoryRoutes = require('./routes/categories');
const contactRoutes = require('./routes/contacts');
const contactLogRoutes = require('./routes/contactLogs');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allows all origins. Replace '*' with a specific domain for added security.
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Explicitly define allowed HTTP methods.
  allowedHeaders: ['Content-Type', 'Authorization'], // Define allowed headers.
  credentials: true, // Allow credentials (cookies, authorization headers, etc.).
}));
app.use(bodyParser.json());

// Routes
app.use('/api/regions', regionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/contact-logs', contactLogRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start Server
const PORT = process.env.PORT || 5001; // Use port 5001 if PORT is not set
app.listen(PORT, () => {
  console.log(`UPM Backend is running on port:${PORT}`);
});

