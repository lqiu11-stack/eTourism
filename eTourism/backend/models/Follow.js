const pool = require('../config/db');

const Follow = {
  async create(visitor_id, ehost_id) {
    const { rows } = await pool.query(
      `INSERT INTO host_follows (visitor_id, ehost_id)
       VALUES ($1, $2)
       ON CONFLICT (visitor_id, ehost_id) DO NOTHING
       RETURNING *`,
      [visitor_id, ehost_id]
    );
    return rows[0] || null;
  },

  async remove(visitor_id, ehost_id) {
    const { rowCount } = await pool.query(
      `DELETE FROM host_follows WHERE visitor_id = $1 AND ehost_id = $2`,
      [visitor_id, ehost_id]
    );
    return rowCount > 0;
  },

  async exists(visitor_id, ehost_id) {
    const { rows } = await pool.query(
      `SELECT 1 FROM host_follows WHERE visitor_id = $1 AND ehost_id = $2 LIMIT 1`,
      [visitor_id, ehost_id]
    );
    return rows.length > 0;
  },

  async countForHost(ehost_id) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM host_follows WHERE ehost_id = $1`,
      [ehost_id]
    );
    return rows[0]?.count || 0;
  },

  // Returns followed hosts with their next upcoming approved experience.
  async listForVisitor(visitor_id) {
    const { rows } = await pool.query(
      `SELECT
         u.id AS ehost_id,
         COALESCE(u.display_name, u.first_name) AS ehost_display_name,
         u.profile_image,
         u.bio,
         f.created_at AS followed_at,
         next_exp.id           AS next_experience_id,
         next_exp.title        AS next_experience_title,
         next_exp.cover_image  AS next_experience_cover,
         next_exp.date_time    AS next_experience_date_time,
         next_exp.country      AS next_experience_country
       FROM host_follows f
       JOIN users u ON u.id = f.ehost_id
       LEFT JOIN LATERAL (
         SELECT e.id, e.title, e.cover_image, e.date_time, e.country
         FROM experiences e
         WHERE e.ehost_id = f.ehost_id
           AND e.status = 'approved'
           AND e.date_time IS NOT NULL
           AND e.date_time > now()
         ORDER BY e.date_time ASC
         LIMIT 1
       ) next_exp ON true
       WHERE f.visitor_id = $1
       ORDER BY f.created_at DESC`,
      [visitor_id]
    );
    return rows;
  },
};

module.exports = Follow;
