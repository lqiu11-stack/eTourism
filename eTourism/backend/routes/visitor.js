const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const {
  getMe,
  getExperiences,
  getExperienceById,
  createBooking,
  getBookings,
  getBookingById,
  createReview,
} = require('../controllers/visitorController');

// GET /api/visitor/me
router.get('/me', requireAuth, getMe);

// GET /api/visitor/experiences
router.get('/experiences', requireAuth, getExperiences);

// GET /api/visitor/experiences/:id
router.get('/experiences/:id', requireAuth, getExperienceById);

// POST /api/visitor/bookings
router.post('/bookings', requireAuth, createBooking);

// GET /api/visitor/bookings
router.get('/bookings', requireAuth, getBookings);

// GET /api/visitor/bookings/:id
router.get('/bookings/:id', requireAuth, getBookingById);

// POST /api/visitor/reviews
router.post('/reviews', requireAuth, createReview);

module.exports = router;
