const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Import the cors middleware
const routes = require('./routes');
const authRoutes = require('./routes/auth');
const pool = require('./db'); // Import the pool from db.js

dotenv.config();

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

const app = express();
const port = process.env.PORT || 3000;

// Use the cors middleware
app.use(cors());

app.use(express.json());
app.use('/api', routes);
app.use('/auth', authRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});