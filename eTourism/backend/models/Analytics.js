const pool = require('../config/db');

const Analytics = {
  async getTopExperiences() {
    const { rows } = await pool.query(`
      SELECT e.id, e.title, e.category, e.country,
             COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS host_name,
             COUNT(b.id) AS booking_count
      FROM experiences e
      LEFT JOIN bookings b ON b.experience_id = e.id
      LEFT JOIN users u ON u.id = e.ehost_id
      WHERE e.status = 'approved'
      GROUP BY e.id, e.title, e.category, e.country, u.first_name, u.last_name
      ORDER BY booking_count DESC LIMIT 10
    `);
    return rows;
  },

  async getTopHosts() {
    const { rows } = await pool.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name AS name,
             u.country, COUNT(b.id) AS booking_count,
             COALESCE(t.tip_total, 0) AS tip_total
      FROM users u
      LEFT JOIN experiences e ON e.ehost_id = u.id
      LEFT JOIN bookings b ON b.experience_id = e.id
      LEFT JOIN (
        SELECT ehost_id, SUM(amount) AS tip_total
        FROM tips
        WHERE status = 'paid'
        GROUP BY ehost_id
      ) t ON t.ehost_id = u.id
      WHERE u.role = 'ehost'
      GROUP BY u.id, u.first_name, u.last_name, u.country, t.tip_total
      ORDER BY booking_count DESC LIMIT 10
    `);
    return rows;
  },

  async getTipsByHost() {
    const { rows } = await pool.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name AS name,
             COUNT(t.id) AS tip_count,
             COALESCE(SUM(t.amount), 0) AS tip_total
      FROM users u
      LEFT JOIN tips t ON t.ehost_id = u.id AND t.status = 'paid'
      WHERE u.role = 'ehost'
      GROUP BY u.id, u.first_name, u.last_name
      HAVING COUNT(t.id) > 0
      ORDER BY tip_total DESC LIMIT 10
    `);
    return rows;
  },

  async getVisitorCountries() {
    const { rows } = await pool.query(`
      SELECT u.country, COUNT(u.id) AS visitor_count
      FROM users u
      WHERE u.role = 'visitor' AND u.country IS NOT NULL
      GROUP BY u.country ORDER BY visitor_count DESC LIMIT 15
    `);
    return rows;
  },

  async getCategoryBreakdown() {
    const { rows } = await pool.query(`
      SELECT e.category, COUNT(b.id) AS booking_count
      FROM experiences e
      LEFT JOIN bookings b ON b.experience_id = e.id
      WHERE e.status = 'approved'
      GROUP BY e.category ORDER BY booking_count DESC
    `);
    return rows;
  },
};

module.exports = Analytics;
