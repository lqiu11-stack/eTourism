const User = require('../models/User');

const getExperiences = async (req, res) => {
  // TODO
};

const deleteExperience = async (req, res) => {
  // TODO
};

const getBookings = async (req, res) => {
  // TODO
};

const getReviews = async (req, res) => {
  // TODO
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
    const bcrypt = require('bcrypt');
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
  deleteExperience,
  getBookings,
  getReviews,
  createUser,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
