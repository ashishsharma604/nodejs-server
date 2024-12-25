const pool = require('../db');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/token');

exports.getAllUsers = async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM users');
    res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const userId = req.params.userId;
  try {
    const [results] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if the user already exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const [result] = await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

    // Generate a token for the new user
    const token = generateToken(result.insertId);

    res.status(201).json({ token });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};