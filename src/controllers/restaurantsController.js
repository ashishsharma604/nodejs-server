const pool = require('../db');
const { validationResult } = require('express-validator');

exports.getAllRestaurantsByUserId = async (req, res) => {
  const userId = req.user.id; // Use the authenticated user's ID

  const query = `
    SELECT r.* FROM restaurants r
    JOIN user_roles ur ON r.id = ur.restaurant_id
    WHERE ur.user_id = ? AND ur.role_id IN (SELECT id FROM roles WHERE name IN ('Admin', 'Sub-admin'))
  `;

  try {
    const [results] = await pool.query(query, [userId]);
    res.json(results);
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    return res.status(500).json({ error: err.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  const { restaurantId } = req.params;

  console.log(`Fetching details for restaurant ${restaurantId}`);

  try {
    // Fetch restaurant details
    const [restaurant] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
    if (restaurant.length === 0) {
      console.log(`Restaurant ${restaurantId} not found`);
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Fetch menu categories and their items
    const menuCategoriesQuery = `
      SELECT mc.id AS category_id, mc.name AS category_name, mi.id AS menu_item_id, mi.name AS menu_item_name, mi.description AS menu_item_description, mi.price AS menu_item_price, mi.image_url AS menu_item_image_url
      FROM menu_categories mc
      LEFT JOIN menu_items mi ON mc.id = mi.category_id
      WHERE mc.restaurant_id = ?
    `;
    const [menuCategories] = await pool.query(menuCategoriesQuery, [restaurantId]);

    // Structure the response
    const categories = {};
    menuCategories.forEach(row => {
      if (!categories[row.category_id]) {
        categories[row.category_id] = {
          category_id: row.category_id,
          category_name: row.category_name,
          menu_items: []
        };
      }

      if (row.menu_item_id) {
        categories[row.category_id].menu_items.push({
          menu_item_id: row.menu_item_id,
          menu_item_name: row.menu_item_name,
          menu_item_description: row.menu_item_description,
          menu_item_price: row.menu_item_price,
          menu_item_image_url: row.menu_item_image_url
        });
      }
    });
    const response = {
      restaurant: restaurant[0],
      menu_categories: Object.values(categories)
    };

    console.log('Response:', response); // Log the response

    res.json(response);
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
};

exports.getMenuCategoriesByRestaurantId = async (req, res) => {
  const restaurantId = req.params.restaurantId;
  const userId = req.user.id; // Use the authenticated user's ID

  const query = `
    SELECT mc.* FROM menu_categories mc
    JOIN restaurants r ON mc.restaurant_id = r.id
    JOIN user_roles ur ON r.id = ur.restaurant_id
    WHERE mc.restaurant_id = ? AND ur.user_id = ? AND ur.role_id IN (SELECT id FROM roles WHERE name IN ('Admin', 'Sub-admin'))
  `;

  try {
    const [results] = await pool.query(query, [restaurantId, userId]);
    res.json(results);
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    return res.status(500).json({ error: err.message });
  }
};

exports.addMenuCategoriesAndItems = async (req, res) => {
  console.log("addMenuCategoriesAndItems method called"); // Initial log

  const { restaurantId } = req.params;
  const { categories } = req.body;

  console.log("inside add categories and items");
  console.log(`restaurantId: ${restaurantId}`);
  console.log(`categories: ${JSON.stringify(categories)}`);

  // Validate request payload
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    for (const category of categories) {
      let categoryId;

      // Check if the category exists
      const [existingCategory] = await pool.query('SELECT id FROM menu_categories WHERE name = ? AND restaurant_id = ?', [category.categoryName, restaurantId]);
      if (existingCategory.length > 0) {
        // Update the existing category
        categoryId = existingCategory[0].id;
        await pool.query('UPDATE menu_categories SET name = ? WHERE id = ?', [category.categoryName, categoryId]);
        console.log(`Updated category: ${category.categoryName}`);
      } else {
        // Insert the new category
        const [categoryResult] = await pool.query('INSERT INTO menu_categories (name, restaurant_id) VALUES (?, ?)', [category.categoryName, restaurantId]);
        categoryId = categoryResult.insertId;
        console.log(`Inserted new category: ${category.categoryName}`);
      }

      for (const item of category.menuItems) {
        // Check if the menu item exists
        const [existingItem] = await pool.query('SELECT id FROM menu_items WHERE name = ? AND category_id = ?', [item.itemName, categoryId]);
        if (existingItem.length > 0) {
          // Update the existing menu item
          await pool.query('UPDATE menu_items SET description = ?, price = ? WHERE id = ?', 
            [item.itemDescription, item.itemPrice, existingItem[0].id]);
          console.log(`Updated menu item: ${item.itemName}`);
        } else {
          // Insert the new menu item
          await pool.query('INSERT INTO menu_items (name, description, price, category_id) VALUES (?, ?, ?, ?)', 
            [item.itemName, item.itemDescription, item.itemPrice, categoryId]);
          console.log(`Inserted new menu item: ${item.itemName}`);
        }
      }
    }

    res.status(201).json({ message: 'Categories and menu items added/updated successfully' });
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    res.status(500).json({ error: 'Failed to add/update categories and menu items' });
  }
};

exports.deleteMenuCategory = async (req, res) => {
  const { restaurantId, categoryId } = req.params;

  console.log(`Deleting category ${categoryId} for restaurant ${restaurantId}`);

  try {
    // Delete the menu items associated with the category
    await pool.query('DELETE FROM menu_items WHERE category_id = ?', [categoryId]);
    console.log(`Deleted menu items for category ${categoryId}`);

    // Delete the category
    await pool.query('DELETE FROM menu_categories WHERE id = ? AND restaurant_id = ?', [categoryId, restaurantId]);
    console.log(`Deleted category ${categoryId}`);

    res.status(200).json({ message: 'Category and associated menu items deleted successfully' });
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    res.status(500).json({ error: 'Failed to delete category and menu items' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  const { restaurantId, categoryId, itemId } = req.params;

  console.log(`Deleting menu item ${itemId} from category ${categoryId} for restaurant ${restaurantId}`);

  try {
    // Delete the menu item using a join to ensure the correct restaurant
    const query = `
      DELETE mi FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.id = ? AND mi.category_id = ? AND mc.restaurant_id = ?
    `;
    await pool.query(query, [itemId, categoryId, restaurantId]);
    console.log(`Deleted menu item ${itemId} from category ${categoryId} for restaurant ${restaurantId}`);

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

exports.addRestaurant = async (req, res) => {
  const { userId } = req.params;
  const { name, address, phone, email} = req.body;

  console.log(`Adding new restaurant for user ${userId}`);
  console.log(`Restaurant details: name=${name}, address=${address}, phone=${phone}, email=${email}`);

  // Validate request payload
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Insert the new restaurant with user_id and a hardcoded QR code
    const qrCode = 'hardcoded-qr-code-string';
    const [result] = await pool.query('INSERT INTO restaurants (user_id, name, phone, email, address, qr_code) VALUES (?, ?, ?, ?, ?, ?)', [userId, name, phone, email, address, qrCode]);
    const restaurantId = result.insertId;
    console.log(`Inserted new restaurant with ID ${restaurantId}`);

    // Fetch the newly added restaurant details
    const [newRestaurant] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);

      // Assign the user as the admin of the new restaurant
      await pool.query('INSERT INTO user_roles (user_id, restaurant_id, role_id) VALUES (?, ?, (SELECT id FROM roles WHERE name = "Admin"))', [userId, restaurantId]);
      console.log(`Assigned user ${userId} as admin of restaurant ${restaurantId}`);
  
      res.status(201).json({ message: 'Restaurant added successfully', restaurant: newRestaurant[0] });
    } catch (err) {
      console.error('Database Error:', err); // Log database errors
      res.status(500).json({ error: 'Failed to add restaurant' });
    }
  };

  exports.deleteRestaurant = async (req, res) => {
    const { userId, restaurantId } = req.params;
  
    console.log(`Deleting restaurant ${restaurantId} for user ${userId}`);
  
    try {
      // Delete the restaurant
      const [result] = await pool.query('DELETE FROM restaurants WHERE id = ? AND user_id = ?', [restaurantId, userId]);
      if (result.affectedRows === 0) {
        console.log(`Restaurant ${restaurantId} not found for user ${userId}`);
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      console.log(`Deleted restaurant ${restaurantId} for user ${userId}`);
  
      res.status(200).json({ message: 'Restaurant deleted successfully' });
    } catch (err) {
      console.error('Database Error:', err); // Log database errors
      res.status(500).json({ error: 'Failed to delete restaurant' });
    }
  };

  exports.updateQRCode = async (req, res) => {
    const { restaurantId } = req.params;
    const { qrCode } = req.body;
  
    console.log(`Updating QR code for restaurant ${restaurantId}`);
    console.log(`New QR code: ${qrCode}`);
  
    // Validate request payload
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
  
    try {
      // Update the QR code for the restaurant
      const [result] = await pool.query('UPDATE restaurants SET qr_code = ? WHERE id = ?', [qrCode, restaurantId]);
      if (result.affectedRows === 0) {
        console.log(`Restaurant ${restaurantId} not found`);
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      console.log(`Updated QR code for restaurant ${restaurantId}`);
   // Fetch the updated restaurant details
   const [updatedRestaurant] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);

   res.status(200).json({ message: 'QR code updated successfully', restaurant: updatedRestaurant[0] });
 } catch (err) {
   console.error('Database Error:', err); // Log database errors
   res.status(500).json({ error: 'Failed to update QR code' });
 }
};


exports.updateMenuItem = async (req, res) => {
  const { categoryId, itemId } = req.params;
  const { menu_item_name, menu_item_description, menu_item_price } = req.body;

  console.log(`Updating menu item ${itemId} for category ${categoryId}`);

  // Validate request payload
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Hardcode the image URL for now
    const imageUrl = 'http://example.com/default-image.jpg';

    // Update the menu item
    const [result] = await pool.query(
      'UPDATE menu_items SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ? AND category_id = ?',
      [menu_item_name, menu_item_description, menu_item_price, imageUrl, itemId, categoryId]
    );

    if (result.affectedRows === 0) {
      console.log(`Menu item ${itemId} not found for category ${categoryId}`);
      return res.status(404).json({ message: 'Menu item not found' });
    }

    console.log(`Updated menu item ${itemId} for category ${categoryId}`);

    res.status(200).json({ message: 'Menu item updated successfully' });
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};