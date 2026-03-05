const pool = require('../config/db');

const User = {
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, email, role, first_name, last_name, date_of_birth, country, language, bio, profile_image, status, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async create({ email, password_hash, role, first_name, last_name, date_of_birth, country, language }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, date_of_birth, country, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, role, first_name, last_name, created_at`,
      [email, password_hash, role, first_name, last_name, date_of_birth, country, language]
    );
    return rows[0];
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const set = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE users SET ${set} WHERE id = $1
       RETURNING id, email, role, first_name, last_name, date_of_birth, country, language, bio, profile_image, status`,
      [id, ...values]
    );
    return rows[0] || null;
  },

  async findAll({ role, status } = {}) {
    let query = 'SELECT id, email, role, first_name, last_name, status, created_at FROM users WHERE 1=1';
    const values = [];
    if (role) { values.push(role); query += ` AND role = $${values.length}`; }
    if (status) { values.push(status); query += ` AND status = $${values.length}`; }
    const { rows } = await pool.query(query, values);
    return rows;
  },

  async delete(id) {
    const { rowCount } = await pool.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  },
};

module.exports = User;
