const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
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
router.get('/me', requireAuth, requireRole('visitor'), getMe);

// GET /api/visitor/experiences
router.get('/experiences', requireAuth, requireRole('visitor'), getExperiences);

// GET /api/visitor/experiences/:id
router.get('/experiences/:id', requireAuth, requireRole('visitor'), getExperienceById);

// POST /api/visitor/bookings
router.post('/bookings', requireAuth, requireRole('visitor'), createBooking);

// GET /api/visitor/bookings
router.get('/bookings', requireAuth, requireRole('visitor'), getBookings);

// GET /api/visitor/bookings/:id
router.get('/bookings/:id', requireAuth, requireRole('visitor'), getBookingById);

// POST /api/visitor/reviews
router.post('/reviews', requireAuth, requireRole('visitor'), createReview);

module.exports = router;
