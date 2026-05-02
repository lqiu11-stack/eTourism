const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserAgreement = require('../models/UserAgreement');
const pool = require('../config/db');

const calculateAge = (dob) => {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
};

const register = async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DATABASE_URL is not configured' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ error: 'JWT_SECRET is not configured' });
    }
    const {
      email,
      password,
      name,
      first_name: firstNameInput,
      last_name: lastNameInput,
      date_of_birth,
      country,
      language,
      bio,
      profile_image,
      accepted_terms,
      accepted_behaviour,
      accepted_recording,
      payment_method_on_file,
    } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    let first_name = firstNameInput ? String(firstNameInput).trim() : '';
    let last_name = lastNameInput ? String(lastNameInput).trim() : '';
    if (!first_name && name && String(name).trim() !== '') {
      const parts = String(name).trim().split(/\s+/);
      first_name = parts[0];
      last_name = parts.slice(1).join(' ');
    }
    if (!first_name) {
      return res.status(400).json({ error: 'Account name is required' });
    }
    if (!date_of_birth) {
      return res.status(400).json({ error: 'Date of birth is required' });
    }
    const age = calculateAge(date_of_birth);
    if (age === null) {
      return res.status(400).json({ error: 'Invalid date of birth' });
    }
    if (age < 18) {
      return res.status(400).json({ error: 'You must be at least 18 years old to register' });
    }
    if (!accepted_terms || !accepted_behaviour || !accepted_recording) {
      return res.status(400).json({
        error: 'You must accept the terms, behaviour rules, and recording consent to register',
      });
    }
    if (!payment_method_on_file) {
      return res.status(400).json({
        error: 'You must confirm you have a valid payment method on file',
      });
    }
    const role = 'visitor';
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const { rows: pendingApp } = await pool.query(
      `SELECT id FROM ehost_applications WHERE email = $1 AND status = 'pending'`,
      [email]
    );
    if (pendingApp.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password_hash,
      role,
      first_name,
      last_name,
      date_of_birth,
      country: country || null,
      language: language || null,
      bio: bio || null,
      profile_image: profile_image || null,
    });
    try {
      await UserAgreement.create({
        user_id: user.id,
        is_over_18: true,
        accepted_terms: true,
        accepted_behaviour: true,
        accepted_recording: true,
        payment_method_on_file: Boolean(payment_method_on_file),
      });
    } catch (agreementErr) {
      console.error('[register agreement]', agreementErr);
      try { await User.delete(user.id); } catch (_) {}
      return res.status(500).json({ error: 'Failed to record user agreement' });
    }
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
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await User.touchLastLogin(user.id);
    const { password_hash, ...userInfo } = user;
    res.json({ token, user: userInfo });
  } catch (err) {
    console.error('[login]', err);
    const message = err.message || 'Login failed';
    res.status(500).json({ error: message });
  }
};

const LEGACY_PLACEHOLDER_DOB = '2000-01-01';

const dobIsLegacyPlaceholder = (dob) => {
  if (!dob) return false;
  if (dob instanceof Date) {
    return dob.toISOString().slice(0, 10) === LEGACY_PLACEHOLDER_DOB;
  }
  return String(dob).slice(0, 10) === LEGACY_PLACEHOLDER_DOB;
};

const oauthLogin = (provider) => async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DATABASE_URL is not configured' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ error: 'JWT_SECRET is not configured' });
    }
    const { email, name } = req.body;
    if (!email) {
      const msg = provider === 'facebook'
        ? 'Email is required. Please ensure your Facebook account is linked to an email.'
        : 'Email is required';
      return res.status(400).json({ error: msg });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.json({ status: 'profile_required', email, name: name || '', provider });
    }

    const agreement = await UserAgreement.findByUser(user.id);
    const ageVerified = Boolean(agreement && agreement.is_over_18) && !dobIsLegacyPlaceholder(user.date_of_birth);
    if (!ageVerified) {
      return res.json({ status: 'profile_required', email, name: name || '', provider });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await User.touchLastLogin(user.id);
    const { password_hash, ...userInfo } = user;
    res.json({ token, user: userInfo });
  } catch (err) {
    console.error(`[${provider}Login]`, err);
    const message = err.message || `${provider} login failed`;
    res.status(500).json({ error: message });
  }
};

const googleLogin = oauthLogin('google');
const facebookLogin = oauthLogin('facebook');

const completeOAuthProfile = async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DATABASE_URL is not configured' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ error: 'JWT_SECRET is not configured' });
    }
    const {
      email,
      provider,
      first_name: firstNameInput,
      last_name: lastNameInput,
      date_of_birth,
      country,
      bio,
      profile_image,
      accepted_terms,
      accepted_behaviour,
      accepted_recording,
      payment_method_on_file,
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (provider !== 'google' && provider !== 'facebook') {
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    const first_name = firstNameInput ? String(firstNameInput).trim() : '';
    const last_name = lastNameInput ? String(lastNameInput).trim() : '';
    if (!first_name) {
      return res.status(400).json({ error: 'First name is required' });
    }
    if (!date_of_birth) {
      return res.status(400).json({ error: 'Date of birth is required' });
    }
    const age = calculateAge(date_of_birth);
    if (age === null) {
      return res.status(400).json({ error: 'Invalid date of birth' });
    }
    if (age < 18) {
      return res.status(400).json({ error: 'You must be at least 18 years old to register' });
    }
    if (!accepted_terms || !accepted_behaviour || !accepted_recording) {
      return res.status(400).json({
        error: 'You must accept the terms, behaviour rules, and recording consent to register',
      });
    }
    if (!payment_method_on_file) {
      return res.status(400).json({
        error: 'You must confirm you have a valid payment method on file',
      });
    }

    const placeholderHash = `${provider.toUpperCase()}_AUTH_NO_PASSWORD`;
    let user = await User.findByEmail(email);
    if (user) {
      user = await User.update(user.id, {
        first_name,
        last_name,
        date_of_birth,
        country: country || null,
        bio: bio || null,
        profile_image: profile_image || null,
        auth_provider: provider,
      });
    } else {
      user = await User.create({
        email,
        password_hash: placeholderHash,
        role: 'visitor',
        first_name,
        last_name,
        date_of_birth,
        country: country || null,
        language: null,
        bio: bio || null,
        profile_image: profile_image || null,
        auth_provider: provider,
      });
    }

    try {
      await UserAgreement.upsert({
        user_id: user.id,
        is_over_18: true,
        accepted_terms: true,
        accepted_behaviour: true,
        accepted_recording: true,
        payment_method_on_file: Boolean(payment_method_on_file),
      });
    } catch (agreementErr) {
      console.error('[completeOAuthProfile agreement]', agreementErr);
      return res.status(500).json({ error: 'Failed to record user agreement' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await User.touchLastLogin(user.id);
    const { password_hash, ...userInfo } = user;
    res.status(201).json({ token, user: userInfo });
  } catch (err) {
    console.error('[completeOAuthProfile]', err);
    const message = err.message || 'Profile completion failed';
    res.status(500).json({ error: message });
  }
};

const checkEmail = async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DATABASE_URL is not configured' });
    }
    const email = (req.query.email || '').trim();
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.json({ available: false });
    }
    const { rows: pendingApp } = await pool.query(
      `SELECT id FROM ehost_applications WHERE email = $1 AND status = 'pending'`,
      [email]
    );
    res.json({ available: pendingApp.length === 0 });
  } catch (err) {
    console.error('[checkEmail]', err);
    res.status(500).json({ error: err.message || 'Email check failed' });
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
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('[resetPassword]', err);
    const message = err.message || 'Password reset failed';
    res.status(500).json({ error: message });
  }
};

module.exports = { register, login, resetPassword, googleLogin, facebookLogin, completeOAuthProfile, checkEmail };

