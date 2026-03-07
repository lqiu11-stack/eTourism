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
  createPaymentSession,
} = require('../controllers/visitorController');

router.get('/me', requireAuth, getMe);

router.get('/experiences', requireAuth, getExperiences);

router.get('/experiences/:id', requireAuth, getExperienceById);

router.post('/bookings', requireAuth, createBooking);

router.get('/bookings', requireAuth, getBookings);

router.get('/bookings/:id', requireAuth, getBookingById);

router.patch('/bookings/:id/reschedule', requireAuth, rescheduleBooking);

router.post('/reviews', requireAuth, createReview);

router.post('/payments/create-session', requireAuth, createPaymentSession);

module.exports = router;