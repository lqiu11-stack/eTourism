const pool = require('../config/db');

const Review = {
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM reviews WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ visitor_id, experience_id, rating, comment }) {
    const { rows } = await pool.query(
      `INSERT INTO reviews (visitor_id, experience_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [visitor_id, experience_id, rating, comment]
    );
    return rows[0];
  },

  async findByExperience(experience_id, { limit, offset } = {}) {
    const cappedLimit = Math.min(Math.max(Number.isInteger(Number(limit)) ? Number(limit) : 50, 1), 100);
    const safeOffset = Math.max(Number.isInteger(Number(offset)) ? Number(offset) : 0, 0);
    const { rows } = await pool.query(
      `SELECT r.*, u.first_name, u.country
       FROM reviews r
       JOIN users u ON r.visitor_id = u.id
       WHERE r.experience_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [experience_id, cappedLimit, safeOffset]
    );
    return rows;
  },

  async averageRating(experience_id) {
    const { rows } = await pool.query(
      'SELECT ROUND(AVG(rating), 2) AS average, COUNT(*) AS total FROM reviews WHERE experience_id = $1',
      [experience_id]
    );
    return rows[0];
  },
};

module.exports = Review;
