const router = require('express').Router();
const { register, login, resetPassword, googleLogin } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/reset-password (visitor only)
router.post('/reset-password', resetPassword);

// POST /api/auth/google
router.post('/google', googleLogin);

module.exports = router;
