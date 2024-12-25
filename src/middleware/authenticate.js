const pool = require('../db');
const { verifyToken } = require('../utils/token');

const getUserIdFromToken = (token) => {
  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
};

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  const userId = getUserIdFromToken(token);

  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const [results] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = results[0];
    next();
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    return res.status(500).json({ error: err.message });
  }
};