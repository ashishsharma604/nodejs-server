const express = require('express');
const router = express.Router();
const menuCategoriesController = require('../controllers/menuCategoriesController');

router.get('/:categoryId/menu-items', menuCategoriesController.getMenuItemsByCategoryId);

module.exports = router;