const pool = require('../config/db');

const AgreementAcceptance = {
  async create(user_id) {
    const { rows } = await pool.query(
      `INSERT INTO user_agreements (user_id)
       VALUES ($1)
       RETURNING id, user_id, agreed_at`,
      [user_id]
    );
    return rows[0];
  },
};

module.exports = AgreementAcceptance;
