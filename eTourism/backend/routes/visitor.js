const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
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
  createPayPalOrder,
  capturePayPalOrder,
  refundBooking,
  captureStripePayment 
} = require('../controllers/visitorController');

router.get('/me', requireRole('visitor'), getMe);

router.get('/experiences', requireRole('visitor'), getExperiences);

router.get('/experiences/:id', requireRole('visitor'), getExperienceById);

router.post('/bookings', requireRole('visitor'), createBooking);

router.get('/bookings', requireRole('visitor'), getBookings);

router.get('/bookings/:id', requireRole('visitor'), getBookingById);

router.patch('/bookings/:id/reschedule', requireRole('visitor'), rescheduleBooking);

router.post('/bookings/:id/refund', requireRole('visitor'), refundBooking);

router.post('/reviews', requireRole('visitor'), createReview);

router.post('/payments/create-session', requireRole('visitor'), createPaymentSession);

router.post('/payments/stripe/capture', requireRole('visitor'), captureStripePayment);

router.post('/payments/paypal/create-order', requireRole('visitor'), createPayPalOrder);

router.post('/payments/paypal/capture-order', requireRole('visitor'), capturePayPalOrder);

module.exports = router;