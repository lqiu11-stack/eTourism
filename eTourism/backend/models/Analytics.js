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
             u.country, COUNT(b.id) AS booking_count
      FROM users u
      LEFT JOIN experiences e ON e.ehost_id = u.id
      LEFT JOIN bookings b ON b.experience_id = e.id
      WHERE u.role = 'ehost'
      GROUP BY u.id, u.first_name, u.last_name, u.country
      ORDER BY booking_count DESC LIMIT 10
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

  async getRevenueByCategory() {
    const { rows } = await pool.query(`
      SELECT e.category, COALESCE(SUM(b.amount_paid), 0) AS revenue
      FROM experiences e
      LEFT JOIN bookings b ON b.experience_id = e.id AND b.status = 'confirmed'
      WHERE e.status = 'approved'
      GROUP BY e.category
      ORDER BY revenue DESC
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
