const pool = require('../config/db');

const NetworkLog = {
  async create({ user_id, experience_id, connection_quality, ip_address, error_details }) {
    const { rows } = await pool.query(
      `INSERT INTO network_logs (user_id, experience_id, connection_quality, ip_address, error_details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, experience_id, connection_quality, ip_address, error_details]
    );
    return rows[0];
  },

  async findByExperience(experience_id) {
    const { rows } = await pool.query(
      'SELECT * FROM network_logs WHERE experience_id = $1 ORDER BY logged_at DESC',
      [experience_id]
    );
    return rows;
  },

  async findByUser(user_id) {
    const { rows } = await pool.query(
      'SELECT * FROM network_logs WHERE user_id = $1 ORDER BY logged_at DESC',
      [user_id]
    );
    return rows;
  },
};

module.exports = NetworkLog;
