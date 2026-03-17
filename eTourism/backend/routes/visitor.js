const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getMe,
  getExperiences,
  getExperienceById,
  createBooking,
  getBookings,
  getBookingById,
  getBookingMeetingLink,
  createReview,
  rescheduleBooking,
  createPaymentSession,
  createPayPalOrder,
  capturePayPalOrder,
  refundBooking,
  captureStripePayment 
} = require('../controllers/visitorController');

router.get('/me', requireAuth, requireRole('visitor'), getMe);

router.get('/experiences', requireAuth, requireRole('visitor'), getExperiences);

router.get('/experiences/:id', requireAuth, requireRole('visitor'), getExperienceById);

router.post('/bookings', requireAuth, requireRole('visitor'), createBooking);

router.get('/bookings', requireAuth, requireRole('visitor'), getBookings);

router.get('/bookings/:id', requireAuth, requireRole('visitor'), getBookingById);

router.get('/bookings/:id/meeting-link', requireAuth, requireRole('visitor'), getBookingMeetingLink);

router.patch('/bookings/:id/reschedule', requireAuth, requireRole('visitor'), rescheduleBooking);
router.post('/bookings/:id/refund', requireAuth, requireRole('visitor'), refundBooking);

router.post('/reviews', requireAuth, requireRole('visitor'), createReview);

router.post('/payments/create-session', requireAuth, requireRole('visitor'), createPaymentSession);

router.post('/payments/stripe/capture', requireAuth, requireRole('visitor'), captureStripePayment);

router.post('/payments/paypal/create-order', requireAuth, requireRole('visitor'), createPayPalOrder);

router.post('/payments/paypal/capture-order', requireAuth, requireRole('visitor'), capturePayPalOrder);

module.exports = router;
