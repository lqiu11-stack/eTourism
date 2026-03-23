const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const {
  getMe,
  getExperiences,
  getExperienceById,
  createBooking,
  getBookings,
  getBookingById,
  getRefundStatus,
  createReview,
  rescheduleBooking,
  createPaymentSession,
  createPayPalOrder,
  capturePayPalOrder,
  refundBooking,
  captureStripePayment 
} = require('../controllers/visitorController');

router.get('/me', requireAuth, getMe);

router.get('/experiences', requireAuth, getExperiences);

router.get('/experiences/:id', requireAuth, getExperienceById);

router.post('/bookings', requireAuth, createBooking);

router.get('/bookings', requireAuth, getBookings);

router.get('/bookings/:id', requireAuth, getBookingById);

router.get('/bookings/:id/refund-status', requireAuth, getRefundStatus);

router.patch('/bookings/:id/reschedule', requireAuth, rescheduleBooking);

router.post('/bookings/:id/refund', requireAuth, refundBooking);

router.post('/reviews', requireAuth, createReview);

router.post('/payments/create-session', requireAuth, createPaymentSession);

router.post('/payments/stripe/capture', requireAuth, captureStripePayment);

router.post('/payments/paypal/create-order', requireAuth, createPayPalOrder);

router.post('/payments/paypal/capture-order', requireAuth, capturePayPalOrder);

module.exports = router;