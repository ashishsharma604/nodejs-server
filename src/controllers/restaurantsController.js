const pool = require('../db');

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
  const restaurantId = req.params.restaurantId;
  const userId = req.user.id; // Use the authenticated user's ID

  const restaurantQuery = `
    SELECT r.* FROM restaurants r
    JOIN user_roles ur ON r.id = ur.restaurant_id
    WHERE r.id = ? AND ur.user_id = ? AND ur.role_id IN (SELECT id FROM roles WHERE name IN ('Admin', 'Sub-admin'))
  `;

  try {
    const [restaurantResults] = await pool.query(restaurantQuery, [restaurantId, userId]);
    if (restaurantResults.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const menuCategoriesQuery = `
      SELECT mc.*, mi.id AS menu_item_id, mi.name AS menu_item_name, mi.description AS menu_item_description, mi.price AS menu_item_price, mi.image_url AS menu_item_image_url
      FROM menu_categories mc
      LEFT JOIN menu_items mi ON mc.id = mi.category_id
      WHERE mc.restaurant_id = ?
    `;

    const [menuCategoriesResults] = await pool.query(menuCategoriesQuery, [restaurantId]);

    // Group menu items by category
    const categories = {};
    menuCategoriesResults.forEach(row => {
      if (!categories[row.id]) {
        categories[row.id] = {
          id: row.id,
          name: row.name,
          created_at: row.created_at,
          menu_items: []
        };
      }
      if (row.menu_item_id) {
        categories[row.id].menu_items.push({
          id: row.menu_item_id,
          name: row.menu_item_name,
          description: row.menu_item_description,
          price: row.menu_item_price,
          image_url: row.menu_item_image_url
        });
      }
    });

    const response = {
      restaurant: restaurantResults[0],
      menu_categories: Object.values(categories)
    };

    res.json(response);
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    return res.status(500).json({ error: err.message });
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