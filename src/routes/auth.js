const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/token');
const pool = require('../db');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('DB_HOST In:', process.env.DB_HOST);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
  try {
    const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({ token, userId: user.id });
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;