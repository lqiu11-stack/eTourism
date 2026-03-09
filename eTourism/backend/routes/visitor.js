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
  rescheduleBooking,
  refundBooking,
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

// PATCH /api/visitor/bookings/:id/reschedule
router.patch('/bookings/:id/reschedule', requireAuth, rescheduleBooking);

// POST /api/visitor/bookings/:id/refund
router.post('/bookings/:id/refund', requireAuth, refundBooking);

// POST /api/visitor/reviews
router.post('/reviews', requireAuth, createReview);

module.exports = router;