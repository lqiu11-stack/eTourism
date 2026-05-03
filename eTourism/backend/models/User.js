const pool = require('../config/db');

const User = {
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, email, role, first_name, last_name, date_of_birth, country, language, bio, profile_image, gender, status, auth_provider, created_at FROM users WHERE id = $1',
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

  async create({ email, password_hash, role, first_name, last_name, date_of_birth, country, language, bio, profile_image, gender, auth_provider }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, date_of_birth, country, language, bio, profile_image, gender, auth_provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, email, role, first_name, last_name, date_of_birth, country, language, bio, profile_image, gender, auth_provider, created_at`,
      [email, password_hash, role, first_name, last_name, date_of_birth, country, language, bio ?? null, profile_image ?? null, gender ?? null, auth_provider ?? null]
    );
    return rows[0];
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const set = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE users SET ${set} WHERE id = $1
       RETURNING id, email, role, first_name, last_name, display_name, date_of_birth, country, language, bio, profile_image, status`,
      [id, ...values]
    );
    return rows[0] || null;
  },

  async findAll({ role, status } = {}) {
    let query = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.status, u.created_at,
             u.last_login_at AS last_active
      FROM users u
      WHERE u.status IS DISTINCT FROM 'deleted'
    `;
    const values = [];
    if (role) { values.push(role); query += ` AND u.role = $${values.length}`; }
    if (status) { values.push(status); query += ` AND u.status = $${values.length}`; }
    query += ' ORDER BY u.id ASC';
    const { rows } = await pool.query(query, values);
    return rows;
  },

  async touchLastLogin(id) {
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  },

  async delete(id) {
    const { rowCount } = await pool.query(
      `UPDATE users
         SET status        = 'deleted',
             email         = 'deleted_' || id || '@example.invalid',
             first_name    = 'Deleted',
             last_name     = 'User',
             bio           = NULL,
             profile_image = NULL,
             password_hash = ''
       WHERE id = $1
         AND status IS DISTINCT FROM 'deleted'`,
      [id]
    );
    return rowCount > 0;
  },
};

module.exports = User;
