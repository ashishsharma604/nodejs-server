const jwt = require('jsonwebtoken');

const secretKey = 'your_secret_key'; // Use a secure secret key in production

exports.generateToken = (userId) => {
  return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
};

exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    return null;
  }
};