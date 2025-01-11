const express = require('express');
const router = express.Router();
const restaurantsController = require('../controllers/restaurantsController');
const { authenticate } = require('../middleware/authenticate'); // Import the authentication middleware

router.get('/user/:userId', authenticate, restaurantsController.getAllRestaurantsByUserId);
router.get('/:restaurantId', restaurantsController.getRestaurantById);
router.get('/:restaurantId/menu-categories', authenticate, restaurantsController.getMenuCategoriesByRestaurantId);

// Add logging to verify the route is being hit
router.post('/:restaurantId/menu-categories', authenticate, (req, res, next) => {
  console.log('Route /:restaurantId/menu-categories hit');
  next();
}, restaurantsController.addMenuCategoriesAndItems);

router.delete('/:restaurantId/menu-categories/:categoryId', authenticate, restaurantsController.deleteMenuCategory);
router.delete('/:restaurantId/menu-categories/:categoryId/menu-items/:itemId', authenticate, restaurantsController.deleteMenuItem);
router.post('/user/:userId/restaurants', authenticate, restaurantsController.addRestaurant);

router.delete('/user/:userId/restaurants/:restaurantId', authenticate, restaurantsController.deleteRestaurant);
router.put('/:restaurantId/qr-code', authenticate, restaurantsController.updateQRCode);

// New endpoint to update a menu item
router.put('/:restaurantId/menu-categories/:categoryId/menu-items/:itemId', authenticate, restaurantsController.updateMenuItem);

module.exports = router;