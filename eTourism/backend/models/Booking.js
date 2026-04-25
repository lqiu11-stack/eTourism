const pool = require('../config/db');

const Booking = {
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({
    visitor_id, experience_id, amount_paid, booking_type, meeting_link,
    qty_normal = 1, qty_discounted = 0, contact_name, contact_email,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO bookings
         (visitor_id, experience_id, amount_paid, booking_type, meeting_link,
          qty_normal, qty_discounted, contact_name, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [visitor_id, experience_id, amount_paid, booking_type, meeting_link,
       qty_normal, qty_discounted, contact_name, contact_email]
    );
    return rows[0];
  },
  
  async updateStatus(id, status) {
    const { rows } = await pool.query(
      'UPDATE bookings SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return rows[0] || null;
  },

  async reschedule({ booking_id, visitor_id, new_experience_id, new_status, reschedule_date }) {
    const { rows } = await pool.query(
      `UPDATE bookings
       SET experience_id = $3, status = $4, reschedule_date = $5
       WHERE id = $1 AND visitor_id = $2
       RETURNING *`,
      [booking_id, visitor_id, new_experience_id, new_status, reschedule_date]
    );
    return rows[0] || null;
  },

  async getRefundContext(booking_id, visitor_id) {
    const { rows } = await pool.query(
      `SELECT
         b.id AS booking_id,
         b.visitor_id,
         b.experience_id,
         b.amount_paid,
         b.status AS booking_status,
         e.date_time,
         p.id AS payment_id,
         p.method AS payment_method,
         p.status AS payment_status
       FROM bookings b
       JOIN experiences e ON b.experience_id = e.id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.id = $1 AND b.visitor_id = $2
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [booking_id, visitor_id]
    );
    return rows[0] || null;
  },

  async findByVisitor(visitor_id, { limit, offset } = {}) {
    const cappedLimit = Math.min(Math.max(Number.isInteger(Number(limit)) ? Number(limit) : 50, 1), 100);
    const safeOffset = Math.max(Number.isInteger(Number(offset)) ? Number(offset) : 0, 0);
    const { rows } = await pool.query(
      `SELECT b.*, e.title, e.date_time, e.cover_image, e.country
       FROM bookings b
       JOIN experiences e ON b.experience_id = e.id
       WHERE b.visitor_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [visitor_id, cappedLimit, safeOffset]
    );
    return rows;
  },

  async findAll({ status, booking_id, limit, offset } = {}) {
    const cappedLimit = Math.min(Math.max(Number.isInteger(Number(limit)) ? Number(limit) : 50, 1), 100);
    const safeOffset = Math.max(Number.isInteger(Number(offset)) ? Number(offset) : 0, 0);
    const values = [];
    const conditions = [];
    if (status) {
      values.push(status);
      conditions.push(`b.status = $${values.length}`);
    }
    if (booking_id && !isNaN(Number(booking_id))) {
      values.push(Number(booking_id));
      conditions.push(`b.id = $${values.length}`);
    }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    values.push(cappedLimit);
    const limitIdx = values.length;
    values.push(safeOffset);
    const offsetIdx = values.length;
    const { rows } = await pool.query(
      `SELECT
         b.id, b.status, b.amount_paid, b.qty_normal, b.qty_discounted,
         b.contact_name, b.contact_email, b.created_at, b.meeting_link,
         e.id          AS experience_id,
         e.title       AS experience_title,
         e.date_time   AS experience_date_time,
         u.id          AS visitor_id,
         u.first_name  AS visitor_first_name,
         u.last_name   AS visitor_last_name,
         u.email       AS visitor_email,
         p.method      AS payment_method,
         r.id          AS refund_id,
         r.status      AS refund_status,
         r.refund_amount,
         r.reason      AS refund_reason
       FROM bookings b
       LEFT JOIN experiences e ON e.id = b.experience_id
       LEFT JOIN users u ON u.id = b.visitor_id
       LEFT JOIN payments p ON p.booking_id = b.id
       LEFT JOIN refunds r ON r.booking_id = b.id
       ${where}
       ORDER BY b.id DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );
    return rows;
  },

  async findByExperience(experience_id, { limit, offset } = {}) {
    const cappedLimit = Math.min(Math.max(Number.isInteger(Number(limit)) ? Number(limit) : 50, 1), 100);
    const safeOffset = Math.max(Number.isInteger(Number(offset)) ? Number(offset) : 0, 0);
    const { rows } = await pool.query(
      `SELECT b.*, u.first_name, u.last_name, u.email
       FROM bookings b
       JOIN users u ON b.visitor_id = u.id
       WHERE b.experience_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [experience_id, cappedLimit, safeOffset]
    );
    return rows;
  },
};

module.exports = Booking; 
