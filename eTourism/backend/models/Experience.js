const pool = require('../config/db');

const Experience = {
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM experiences WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({
    ehost_id, title, description, category, country, location_name,
    latitude, longitude, date_time, duration_minutes, max_visitors,
    price, cover_image, gender_preference, allows_piggyback,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO experiences
         (ehost_id, title, description, category, country, location_name,
          latitude, longitude, date_time, duration_minutes, max_visitors,
          price, cover_image, gender_preference, allows_piggyback)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [ehost_id, title, description, category, country, location_name,
       latitude, longitude, date_time, duration_minutes, max_visitors,
       price, cover_image, gender_preference, allows_piggyback]
    );
    return rows[0];
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const set = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE experiences SET ${set} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] || null;
  },

  async findAll({ status, category, country, ehost_id } = {}) {
    let query = 'SELECT * FROM experiences WHERE 1=1';
    const values = [];
    if (status)   { values.push(status);   query += ` AND status = $${values.length}`; }
    if (category) { values.push(category); query += ` AND category = $${values.length}`; }
    if (country)  { values.push(country);  query += ` AND country = $${values.length}`; }
    if (ehost_id) { values.push(ehost_id); query += ` AND ehost_id = $${values.length}`; }
    query += ' ORDER BY date_time ASC';
    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findByHost(ehost_id) {
    const { rows } = await pool.query(
      'SELECT * FROM experiences WHERE ehost_id = $1 ORDER BY created_at DESC',
      [ehost_id]
    );
    return rows;
  },
};

module.exports = Experience;
