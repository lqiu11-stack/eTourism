const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DATABASE_URL is not configured' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ error: 'JWT_SECRET is not configured' });
    }
    const { email, password, name, date_of_birth } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'Account name is required' });
    }
    if (!date_of_birth) {
      return res.status(400).json({ error: 'Date of birth is required' });
    }
    const role = 'visitor';
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const first_name = String(name).trim();
    const last_name = '';
    const user = await User.create({
      email,
      password_hash,
      role,
      first_name,
      last_name,
      date_of_birth,
      country: null,
      language: null,
    });
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[register]', err);
    const message = err.message || (err.detail ? `Database: ${err.detail}` : 'Registration failed');
    res.status(500).json({ error: message });
  }
};

const login = async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DATABASE_URL is not configured' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ error: 'JWT_SECRET is not configured' });
    }
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.role === 'ehost') {
      return res.status(403).json({ error: 'Ehost login is disabled' });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password_hash, ...userInfo } = user;
    res.json({ token, user: userInfo });
  } catch (err) {
    console.error('[login]', err);
    const message = err.message || 'Login failed';
    res.status(500).json({ error: message });
  }
};

const resetPassword = async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DATABASE_URL is not configured' });
    }
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Email, newPassword and confirmPassword are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirm password do not match' });
    }
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }
    const password_hash = await bcrypt.hash(newPassword, 10);
    await User.update(user.id, { password_hash });
    res.json({ ok: true });
  } catch (err) {
    console.error('[resetPassword]', err);
    const message = err.message || 'Password reset failed';
    res.status(500).json({ error: message });
  }
};

module.exports = { register, login, resetPassword };

