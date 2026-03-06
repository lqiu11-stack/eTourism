const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/register  (visitor only)
// Body: { email, password, first_name, last_name, date_of_birth, country, language }
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, date_of_birth, country, language } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ message: 'email, password, first_name, last_name are required' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password_hash,
      role: 'visitor',
      first_name,
      last_name,
      date_of_birth,
      country,
      language,
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.status(201).json({ message: 'Registered successfully', token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

// POST /api/auth/login  (all roles)
// Body: { email, password }
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

module.exports = { register, login };
