const router = require('express').Router();
const { register, login, resetPassword, googleLogin,facebookLogin, checkEmail } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// GET /api/auth/check-email?email=...
router.get('/check-email', checkEmail);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/reset-password (visitor only)
router.post('/reset-password', resetPassword);

// POST /api/auth/google
router.post('/google', googleLogin);

// POST /api/auth/facebookLogin
router.post('/facebook', facebookLogin);

module.exports = router;
