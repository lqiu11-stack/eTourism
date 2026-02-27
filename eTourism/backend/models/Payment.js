const pool = require('../config/db');

const Payment = {
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ booking_id, visitor_id, amount, method, transaction_id }) {
    const { rows } = await pool.query(
      `INSERT INTO payments (booking_id, visitor_id, amount, method, transaction_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [booking_id, visitor_id, amount, method, transaction_id]
    );
    return rows[0];
  },

  async findByBooking(booking_id) {
    const { rows } = await pool.query(
      'SELECT * FROM payments WHERE booking_id = $1',
      [booking_id]
    );
    return rows;
  },

  async findByVisitor(visitor_id) {
    const { rows } = await pool.query(
      'SELECT * FROM payments WHERE visitor_id = $1 ORDER BY created_at DESC',
      [visitor_id]
    );
    return rows;
  },
};

module.exports = Payment;
