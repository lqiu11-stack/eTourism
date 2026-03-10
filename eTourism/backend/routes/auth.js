const router = require('express').Router();
const { register, login, resetPassword } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/reset-password (visitor only)
router.post('/reset-password', resetPassword);

module.exports = router;
