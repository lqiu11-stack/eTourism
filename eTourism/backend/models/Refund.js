const pool = require('../config/db');

const Refund = {
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM refunds WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findByBookingId(booking_id) {
    const { rows } = await pool.query(
      'SELECT * FROM refunds WHERE booking_id = $1 ORDER BY id DESC LIMIT 1',
      [booking_id]
    );
    return rows[0] || null;
  },

  async create({
    booking_id,
    payment_id,
    refund_amount,
    refund_percentage,
    days_before_event,
    status,
    reason,
    processed_at,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO refunds
       (booking_id, payment_id, refund_amount, refund_percentage, days_before_event, status, reason, processed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        booking_id,
        payment_id,
        refund_amount,
        refund_percentage,
        days_before_event,
        status,
        reason,
        processed_at,
      ]
    );
    return rows[0];
  },

  async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE refunds
       SET status = $2, processed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );
    return rows[0] || null;
  },

  async findByBooking(booking_id) {
    const { rows } = await pool.query(
      'SELECT * FROM refunds WHERE booking_id = $1 ORDER BY id DESC',
      [booking_id]
    );
    return rows;
  },
};

module.exports = Refund;