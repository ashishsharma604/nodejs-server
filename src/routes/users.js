const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.post('/register', usersController.registerUser);
router.get('/', usersController.getAllUsers);
router.get('/:userId', usersController.getUserById);

module.exports = router;