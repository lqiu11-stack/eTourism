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
    ehost_id, title, description, category, country, continent, location_name,
    latitude, longitude, date_time, duration_minutes, max_visitors,
    price, price_discounted, cover_image, gender_preference, allows_piggyback,
    sample_video_url, video_description, video_highlights, language = 'English',
    meeting_link,
    allows_souvenir_addon = false, souvenir_price = null,
    allows_video_addon = false, video_addon_price = null,
    max_piggyback_visitors = null,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO experiences
         (ehost_id, title, description, category, country, continent, location_name,
          latitude, longitude, date_time, duration_minutes, max_visitors,
          price, price_discounted, cover_image, gender_preference, allows_piggyback,
          sample_video_url, video_description, video_highlights, language, meeting_link,
          allows_souvenir_addon, souvenir_price, allows_video_addon, video_addon_price,
          max_piggyback_visitors)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
       RETURNING *`,
      [ehost_id, title, description, category, country, continent, location_name,
       latitude, longitude, date_time, duration_minutes, max_visitors,
       price, price_discounted, cover_image, gender_preference, allows_piggyback,
       sample_video_url, video_description, video_highlights, language, meeting_link,
       allows_souvenir_addon, souvenir_price, allows_video_addon, video_addon_price,
       max_piggyback_visitors]
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

  async findAll({ status, category, country, continent, ehost_id, language, price_min, price_max, search, gender_preference, exclude_gender_preference } = {}) {
    let query = `SELECT e.*,
                        COALESCE(u.display_name, 'Host') AS ehost_display_name,
                        u.profile_image AS ehost_profile_image
                 FROM experiences e
                 LEFT JOIN users u ON u.id = e.ehost_id
                 WHERE 1=1`;
    const values = [];
    if (status)    { values.push(status);    query += ` AND e.status = $${values.length}`; }
    else           { query += ` AND e.status <> 'deleted'`; }
    if (category)  { values.push(category);  query += ` AND e.category = $${values.length}`; }
    if (country)   { values.push(country);   query += ` AND e.country = $${values.length}`; }
    if (continent) { values.push(continent); query += ` AND e.continent = $${values.length}`; }
    if (ehost_id)  { values.push(ehost_id);  query += ` AND e.ehost_id = $${values.length}`; }
    if (language)  { values.push(language);  query += ` AND e.language = $${values.length}`; }
    if (price_min) { values.push(Number(price_min)); query += ` AND e.price >= $${values.length}`; }
    if (price_max) { values.push(Number(price_max)); query += ` AND e.price <= $${values.length}`; }
    if (gender_preference) {
      values.push(gender_preference);
      query += ` AND e.gender_preference = $${values.length}`;
    }
    if (exclude_gender_preference) {
      values.push(exclude_gender_preference);
      query += ` AND (e.gender_preference IS NULL OR e.gender_preference <> $${values.length})`;
    }
    if (search)    { values.push(`%${search.toLowerCase()}%`); query += ` AND (LOWER(e.title) LIKE $${values.length} OR LOWER(e.location_name) LIKE $${values.length} OR LOWER(e.description) LIKE $${values.length})`; }
    query += ' ORDER BY e.date_time ASC';
    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findByIdWithHost(id) {
    const { rows } = await pool.query(
      `SELECT e.*,
              COALESCE(u.display_name, 'Host') AS ehost_first_name,
              u.bio           AS ehost_bio,
              u.profile_image AS ehost_profile_image
       FROM experiences e
       LEFT JOIN users u ON u.id = e.ehost_id
       WHERE e.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findByHost(ehost_id, { status } = {}) {
    const values = [ehost_id];
    let query = 'SELECT * FROM experiences WHERE ehost_id = $1';
    if (status) {
      values.push(status);
      query += ` AND status = $${values.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, values);
    return rows;
  },
  async delete(id) {
    const { rowCount } = await pool.query(
      'DELETE FROM experiences WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  },
};

module.exports = Experience;
