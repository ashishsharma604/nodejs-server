const pool = require('../db');

exports.getMenuItemsByCategoryId = async (req, res) => {
  const categoryId = req.params.categoryId;

  const query = 'SELECT * FROM menu_items WHERE category_id = ?';

  try {
    const [results] = await pool.query(query, [categoryId]);
    res.json(results);
  } catch (err) {
    console.error('Database Error:', err); // Log database errors
    return res.status(500).json({ error: err.message });
  }
};