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

  async findByVisitor(visitor_id) {
    const { rows } = await pool.query(
      `SELECT b.*, e.title, e.date_time, e.cover_image
       FROM bookings b
       JOIN experiences e ON b.experience_id = e.id
       WHERE b.visitor_id = $1
       ORDER BY b.created_at DESC`,
      [visitor_id]
    );
    return rows;
  },

  async findByExperience(experience_id) {
    const { rows } = await pool.query(
      `SELECT b.*, u.first_name, u.last_name, u.email
       FROM bookings b
       JOIN users u ON b.visitor_id = u.id
       WHERE b.experience_id = $1
       ORDER BY b.created_at DESC`,
      [experience_id]
    );
    return rows;
  },
};

module.exports = Booking;
