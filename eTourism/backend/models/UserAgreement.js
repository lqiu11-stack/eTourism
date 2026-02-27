const pool = require('../config/db');

const UserAgreement = {
  async findByUser(user_id) {
    const { rows } = await pool.query(
      'SELECT * FROM user_agreements WHERE user_id = $1',
      [user_id]
    );
    return rows[0] || null;
  },

  async create({ user_id, is_over_18, accepted_terms, accepted_behaviour, accepted_recording, payment_method_on_file }) {
    const { rows } = await pool.query(
      `INSERT INTO user_agreements
         (user_id, is_over_18, accepted_terms, accepted_behaviour, accepted_recording, payment_method_on_file)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, is_over_18, accepted_terms, accepted_behaviour, accepted_recording, payment_method_on_file]
    );
    return rows[0];
  },

  async update(user_id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const set = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE user_agreements SET ${set} WHERE user_id = $1 RETURNING *`,
      [user_id, ...values]
    );
    return rows[0] || null;
  },
};

module.exports = UserAgreement;
