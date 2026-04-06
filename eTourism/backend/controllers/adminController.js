const User = require('../models/User');
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');

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
};