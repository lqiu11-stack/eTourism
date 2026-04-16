const User = require('../models/User');
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const ExperienceScore = require('../models/ExperienceScore');
const Refund = require('../models/Refund');
const Payment = require('../models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

const getPayPalClient = () => {
  const env = new checkoutNodeJssdk.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_SECRET
  );
  return new checkoutNodeJssdk.core.PayPalHttpClient(env);
};

// GET /api/admin/experiences?status=pending

const getExperiences = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const experiences = await Experience.findAll({ status });
    res.json(experiences);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// PATCH /api/admin/experiences/:id/approve
const approveExperience = async (req, res) => {
  try {
    const experience = await Experience.update(req.params.id, { status: 'approved' });
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }
    res.json({ message: 'Experience approved.', experience });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// PATCH /api/admin/experiences/:id/reject
const rejectExperience = async (req, res) => {
  try {
    const experience = await Experience.update(req.params.id, { status: 'rejected' });
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }
    res.json({ message: 'Experience rejected.', experience });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};


// DELETE /api/admin/experiences/:id
const deleteExperience = async (req, res) => {
  try {
    const deleted = await Experience.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Experience not found' });
    res.json({ message: 'Experience deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const bookings = await Booking.findAll({ status });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getReviews = async (req, res) => {
  // TODO
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const [topExperiences, topHosts, visitorCountries, categoryBreakdown] = await Promise.all([
      pool.query(`
        SELECT e.id, e.title, e.category, e.country,
               COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS host_name,
               COUNT(b.id) AS booking_count
        FROM experiences e
        LEFT JOIN bookings b ON b.experience_id = e.id
        LEFT JOIN users u ON u.id = e.ehost_id
        WHERE e.status = 'approved'
        GROUP BY e.id, e.title, e.category, e.country, u.first_name, u.last_name
        ORDER BY booking_count DESC LIMIT 10
      `),
      pool.query(`
        SELECT u.id, u.first_name || ' ' || u.last_name AS name,
               u.country, COUNT(b.id) AS booking_count
        FROM users u
        LEFT JOIN experiences e ON e.ehost_id = u.id
        LEFT JOIN bookings b ON b.experience_id = e.id
        WHERE u.role = 'ehost'
        GROUP BY u.id, u.first_name, u.last_name, u.country
        ORDER BY booking_count DESC LIMIT 10
      `),
      pool.query(`
        SELECT u.country, COUNT(u.id) AS visitor_count
        FROM users u
        WHERE u.role = 'visitor' AND u.country IS NOT NULL
        GROUP BY u.country ORDER BY visitor_count DESC LIMIT 15
      `),
      pool.query(`
        SELECT e.category, COUNT(b.id) AS booking_count
        FROM experiences e
        LEFT JOIN bookings b ON b.experience_id = e.id
        WHERE e.status = 'approved'
        GROUP BY e.category ORDER BY booking_count DESC
      `),
    ]);

    res.json({
      topExperiences: topExperiences.rows,
      topHosts: topHosts.rows,
      visitorCountries: visitorCountries.rows,
      categoryBreakdown: categoryBreakdown.rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// POST /api/admin/experiences/:id/score
// Body: { result: 'pass'|'fail', comment: string }
const scoreExperience = async (req, res) => {
  try {
    const { result, comment } = req.body;
    if (!['pass', 'fail'].includes(result)) {
      return res.status(400).json({ message: 'result must be "pass" or "fail"' });
    }
    if (result === 'fail' && !comment?.trim()) {
      return res.status(400).json({ message: 'A comment is required when marking as fail' });
    }

    const score = await ExperienceScore.create({
      experience_id: req.params.id,
      admin_id: req.user.id,
      wifi_score: null,
      safety_score: null,
      legal_score: null,
      content_score: null,
      accessibility_score: null,
      description_score: null,
      pricing_score: null,
      total_score: null,
      result,
      comment: comment?.trim() || null,
    });

    if (result === 'fail') {
      await Experience.update(req.params.id, { status: 'rejected' });
    }

    res.json({ message: `Experience marked as ${result}.`, score });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// GET /api/admin/experiences/:id/scores
const getExperienceScores = async (req, res) => {
  try {
    const scores = await ExperienceScore.findByExperience(req.params.id);
    res.json(scores);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// GET /api/admin/applications?status=pending
const getApplications = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM ehost_applications';
    const values = [];
    if (status) {
      values.push(status);
      query += ` WHERE status = $1`;
    }
    query += ' ORDER BY id DESC';
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// PATCH /api/admin/applications/:id/approve
// Creates a user account with role=ehost and marks application as approved
const approveApplication = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM ehost_applications WHERE id = $1',
      [req.params.id]
    );
    const application = rows[0];
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ message: `Application is already ${application.status}` });
    }

    const existing = await User.findByEmail(application.email);
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    // Generate a temporary password — ehost must reset on first login
    const tempPassword = Math.random().toString(36).slice(-10);
    const password_hash = await bcrypt.hash(tempPassword, 10);

    const nameParts = application.name.trim().split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || '';

    const user = await User.create({
      email: application.email,
      password_hash,
      role: 'ehost',
      first_name,
      last_name,
      date_of_birth: application.birthday,
      country: application.preferred_country,
      language: null,
    });

    await pool.query(
      'UPDATE ehost_applications SET status = $1 WHERE id = $2',
      ['approved', req.params.id]
    );

    res.json({
      message: 'Application approved. Ehost account created.',
      user,
      temp_password: tempPassword,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// PATCH /api/admin/applications/:id/reject
const rejectApplication = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM ehost_applications WHERE id = $1',
      [req.params.id]
    );
    const application = rows[0];
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ message: `Application is already ${application.status}` });
    }

    await pool.query(
      'UPDATE ehost_applications SET status = $1 WHERE id = $2',
      ['rejected', req.params.id]
    );

    res.json({ message: 'Application rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// POST /api/admin/users
// Body: { email, password, role, first_name, last_name, date_of_birth, country, language }
const createUser = async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, date_of_birth, country, language } = req.body;
    if (!email || !password || !role || !first_name || !last_name) {
      return res.status(400).json({ message: 'email, password, role, first_name, last_name are required' });
    }
    if (!['visitor', 'ehost', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be visitor, ehost, or admin' });
    }
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, role, first_name, last_name, date_of_birth, country, language });
    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const users = await User.findAll({ role, status });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// PATCH /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or suspended' });
    }
    const user = await User.update(req.params.id, { status });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `User status updated to ${status}`, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['visitor', 'ehost', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be visitor, ehost, or admin' });
    }
    const user = await User.update(req.params.id, { role });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `User role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const deleted = await User.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};


// GET /api/admin/refunds?status=pending
const getRefunds = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT
        r.id            AS refund_id,
        r.status        AS refund_status,
        r.refund_amount,
        r.refund_percentage,
        r.days_before_event,
        r.reason,
        r.processed_at,
        b.id            AS booking_id,
        b.amount_paid,
        b.status        AS booking_status,
        e.title         AS experience_title,
        e.date_time     AS experience_date_time,
        u.first_name    AS visitor_first_name,
        u.last_name     AS visitor_last_name,
        u.email         AS visitor_email,
        p.method        AS payment_method,
        p.transaction_id
      FROM refunds r
      JOIN bookings b   ON b.id = r.booking_id
      LEFT JOIN experiences e ON e.id = b.experience_id
      LEFT JOIN users u ON u.id = b.visitor_id
      LEFT JOIN payments p ON p.booking_id = b.id
    `;
    const values = [];
    if (status) {
      values.push(status);
      query += ` WHERE r.status = $1`;
    }
    query += ' ORDER BY r.id DESC';
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// PATCH /api/admin/refunds/:id/approve
const approveRefund = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);
    if (!refund) return res.status(404).json({ message: 'Refund not found' });
    if (refund.status !== 'pending') {
      return res.status(400).json({ message: `Refund is already ${refund.status}` });
    }

    const payments = await Payment.findByBooking(refund.booking_id);
    const payment = payments && payments[0];
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    // Process the refund through the payment gateway
    let gatewayRefundId = null;
    if (payment.method === 'stripe') {
      if (!payment.transaction_id) {
        return res.status(400).json({ message: 'Stripe transaction_id is missing' });
      }
      const stripeRefund = await stripe.refunds.create({
        payment_intent: payment.transaction_id,
        amount: Math.round(Number(refund.refund_amount) * 100),
      });
      gatewayRefundId = stripeRefund.id;
    } else if (payment.method === 'paypal') {
      if (!payment.transaction_id) {
        return res.status(400).json({ message: 'PayPal transaction_id is missing' });
      }
      const client = getPayPalClient();
      const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(payment.transaction_id);
      request.requestBody({
        amount: { currency_code: 'GBP', value: Number(refund.refund_amount).toFixed(2) },
      });
      const response = await client.execute(request);
      gatewayRefundId = response.result.id;
    } else {
      return res.status(400).json({ message: `Unsupported payment method: ${payment.method}` });
    }

    await Refund.updateStatus(refund.id, 'approved');
    await Booking.updateStatus(refund.booking_id, 'refunded');

    res.json({ message: 'Refund approved and processed.', gateway_refund_id: gatewayRefundId });
  } catch (err) {
    console.error('Approve Refund Error:', err);
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// PATCH /api/admin/refunds/:id/reject
const rejectRefund = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);
    if (!refund) return res.status(404).json({ message: 'Refund not found' });
    if (refund.status !== 'pending') {
      return res.status(400).json({ message: `Refund is already ${refund.status}` });
    }
    await Refund.updateStatus(refund.id, 'rejected');
    await Booking.updateStatus(refund.booking_id, 'confirmed');
    res.json({ message: 'Refund rejected. Booking restored to confirmed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

module.exports = {
  getExperiences,
  approveExperience,
  rejectExperience,
  deleteExperience,
  getBookings,
  getReviews,
  getApplications,
  approveApplication,
  rejectApplication,
  createUser,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAnalytics,
  scoreExperience,
  getExperienceScores,
  getRefunds,
  approveRefund,
  rejectRefund,
};