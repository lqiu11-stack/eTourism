const pool = require('../config/db');

const Tip = {
  async create({ visitor_id, ehost_id, booking_id, amount, method, message }) {
    const { rows } = await pool.query(
      `INSERT INTO tips (visitor_id, ehost_id, booking_id, amount, method, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [visitor_id, ehost_id, booking_id ?? null, amount, method, message ?? null]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM tips WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async markPaid(id, transaction_id) {
    const { rows } = await pool.query(
      `UPDATE tips
         SET status = 'paid', transaction_id = $2
       WHERE id = $1
       RETURNING *`,
      [id, transaction_id]
    );
    return rows[0] || null;
  },

  async markFailed(id) {
    const { rows } = await pool.query(
      `UPDATE tips SET status = 'failed' WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] || null;
  },

  async listForEhost(ehost_id) {
    const { rows } = await pool.query(
      `SELECT t.id, t.amount, t.currency, t.method, t.status, t.message, t.created_at,
              t.booking_id,
              e.title AS experience_title
         FROM tips t
         LEFT JOIN bookings b ON b.id = t.booking_id
         LEFT JOIN experiences e ON e.id = b.experience_id
        WHERE t.ehost_id = $1 AND t.status = 'paid'
        ORDER BY t.created_at DESC`,
      [ehost_id]
    );
    return rows;
  },

  async sumForEhost(ehost_id) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric(12,2) AS total
         FROM tips
        WHERE ehost_id = $1 AND status = 'paid'`,
      [ehost_id]
    );
    return Number(rows[0]?.total ?? 0);
  },
};

module.exports = Tip;
