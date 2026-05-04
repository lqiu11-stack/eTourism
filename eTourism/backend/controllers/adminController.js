const User = require('../models/User');
const UserAgreement = require('../models/UserAgreement');
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const ExperienceScore = require('../models/ExperienceScore');
const Refund = require('../models/Refund');
const Payment = require('../models/Payment');
const Analytics = require('../models/Analytics');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

const AGREEMENT_TITLE = 'eTourism User Agreement & Terms of Service';

const AGREEMENT_CONTENT = `By registering for or using the eTourism platform, you agree to be bound by this User Agreement. You must be at least 18 years old. You are responsible for your account security and for complying with conduct and payment rules when booking or hosting experiences. For the full text, contact support or refer to product documentation.

We may update this agreement; continued use after changes constitutes acceptance.`;

const getAgreement = async (req, res) => {
  try {
    return res.status(200).json({
      title: AGREEMENT_TITLE,
      content: AGREEMENT_CONTENT,
    });
  } catch (err) {
    console.error('[getAgreement]', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const acceptAgreement = async (req, res) => {
  try {
    const userId = req.body.userId != null ? Number(req.body.userId) : NaN;
    if (Number.isNaN(userId) || userId < 1) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const existing = await UserAgreement.findByUser(userId);
    if (existing) {
      return res.status(200).json({
        message: 'Agreement already on file',
        record: existing,
      });
    }

    const record = await UserAgreement.create({
      user_id: userId,
      is_over_18: true,
      accepted_terms: true,
      accepted_behaviour: true,
      accepted_recording: true,
      payment_method_on_file: false,
    });

    return res.status(201).json({
      message: 'Agreement accepted',
      record,
    });
  } catch (err) {
    console.error('[acceptAgreement]', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getPayPalClient = () => {
  const env = new checkoutNodeJssdk.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_SECRET
  );
  return new checkoutNodeJssdk.core.PayPalHttpClient(env);
};

// GET /api/admin/experiences?status=pending&search=tokyo
const getExperiences = async (req, res) => {
  try {
    const { status = 'pending', search } = req.query;
    const experiences = await Experience.findAll({ status, search: search || undefined });
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
    const updated = await Experience.update(req.params.id, { status: 'deleted' });
    if (!updated) return res.status(404).json({ message: 'Experience not found' });
    res.json({ message: 'Experience deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getBookings = async (req, res) => {
  try {
    const { status, booking_id } = req.query;
    const bookings = await Booking.findAll({ status, booking_id: booking_id || undefined });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const [topExperiences, topHosts, revenueByCategory, categoryBreakdown] = await Promise.all([
      Analytics.getTopExperiences(),
      Analytics.getTopHosts(),
      Analytics.getRevenueByCategory(),
      Analytics.getCategoryBreakdown(),
    ]);

    res.json({ topExperiences, topHosts, revenueByCategory, categoryBreakdown });
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
      admin_id: req.userId,
      result,
      comment: comment?.trim() || null,
    });

    if (result === 'pass') {
      await Experience.update(req.params.id, { status: 'approved' });
    } else {
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

// GET /api/admin/applications?status=pending&search=john
const getApplications = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM ehost_applications';
    const values = [];
    const conditions = [];
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(name) LIKE $${values.length} OR LOWER(email) LIKE $${values.length})`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
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

    if (!application.password_hash) {
      return res.status(400).json({ message: 'Application has no password on file. Applicant must resubmit with a password.' });
    }

    const nameParts = application.name.trim().split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || '';

    const user = await User.create({
      email: application.email,
      password_hash: application.password_hash,
      role: 'ehost',
      first_name,
      last_name,
      date_of_birth: application.birthday,
      country: application.country,
      language: null,
      gender: application.gender || null,
    });

    await pool.query(
      'UPDATE ehost_applications SET status = $1 WHERE id = $2',
      ['approved', req.params.id]
    );

    res.json({
      message: 'Application approved. Ehost account created.',
      user,
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
  getAgreement,
  acceptAgreement,
  getExperiences,
  approveExperience,
  rejectExperience,
  deleteExperience,
  getBookings,
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
