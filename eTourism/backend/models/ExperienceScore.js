const pool = require('../config/db');

const ExperienceScore = {
  async findByExperience(experience_id) {
    const { rows } = await pool.query(
      'SELECT * FROM experience_scores WHERE experience_id = $1 ORDER BY scored_at DESC',
      [experience_id]
    );
    return rows;
  },

  async create({
    experience_id, admin_id, wifi_score, safety_score, legal_score,
    content_score, accessibility_score, description_score, pricing_score,
    total_score, result, comment,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO experience_scores
         (experience_id, admin_id, wifi_score, safety_score, legal_score,
          content_score, accessibility_score, description_score, pricing_score,
          total_score, result, comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [experience_id, admin_id, wifi_score, safety_score, legal_score,
       content_score, accessibility_score, description_score, pricing_score,
       total_score, result, comment]
    );
    return rows[0];
  },
};

module.exports = ExperienceScore;
