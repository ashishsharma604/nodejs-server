const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes');
const authRoutes = require('./routes/auth');
const pool = require('./db'); // Import the pool from db.js

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes);
app.use('/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});