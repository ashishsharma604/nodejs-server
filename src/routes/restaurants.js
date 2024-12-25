const express = require('express');
const router = express.Router();
const restaurantsController = require('../controllers/restaurantsController');
const { authenticate } = require('../middleware/authenticate'); // Import the authentication middleware

router.get('/user/:userId', authenticate, restaurantsController.getAllRestaurantsByUserId);
router.get('/:restaurantId', authenticate, restaurantsController.getRestaurantById);
router.get('/:restaurantId/menu-categories', authenticate, restaurantsController.getMenuCategoriesByRestaurantId);

module.exports = router;