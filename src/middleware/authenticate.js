const pool = require('../db');
const { verifyToken } = require('../utils/token');

const getUserIdFromToken = (token) => {
  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
};

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from "Bearer <token>"
  console.log(`Token extracted: ${token}`);

  const userId = getUserIdFromToken(token);
  if (!userId) {
    console.log('Invalid token');
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      console.log('User not found');
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user[0];
    console.log(`Authenticated user: ${req.user.email}`);
    next();
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    return res.status(500).json({ error: 'Failed to authenticate user' });
  }
};