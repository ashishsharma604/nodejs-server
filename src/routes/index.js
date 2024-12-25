const express = require('express');
const router = express.Router();

const usersRoutes = require('./users');
const restaurantsRoutes = require('./restaurants');
const menuCategoriesRoutes = require('./menuCategories');

router.use('/users', usersRoutes);
router.use('/restaurants', restaurantsRoutes);
router.use('/menu-categories', menuCategoriesRoutes);

module.exports = router;