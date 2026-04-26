const pool = require('../config/db');

const ExperienceScore = {
  async findByExperience(experience_id) {
    const { rows } = await pool.query(
      'SELECT * FROM experience_scores WHERE experience_id = $1 ORDER BY scored_at DESC',
      [experience_id]
    );
    return rows;
  },

  async create({ experience_id, admin_id, result, comment }) {
    const { rows } = await pool.query(
      `INSERT INTO experience_scores (experience_id, admin_id, result, comment)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [experience_id, admin_id, result, comment]
    );
    return rows[0];
  },
};

module.exports = ExperienceScore;
