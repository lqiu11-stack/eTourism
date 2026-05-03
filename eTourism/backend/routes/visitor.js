const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
const {
  getMe,
  updateMe,
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
  captureStripePayment,
  getReviews,
  followHost,
  unfollowHost,
  getFollowStatus,
  listFollows,
} = require('../controllers/visitorController');

router.get('/me', requireRole('visitor'), getMe);

router.patch('/me', requireRole('visitor'), updateMe);

router.get('/experiences', getExperiences);

router.get('/experiences/:id', getExperienceById);

router.post('/bookings', requireRole('visitor'), createBooking);

router.get('/bookings', requireRole('visitor'), getBookings);

router.get('/bookings/:id', requireRole('visitor'), getBookingById);

router.get('/bookings/:id/refund-status', requireRole('visitor'), getRefundStatus);

router.patch('/bookings/:id/reschedule', requireRole('visitor'), rescheduleBooking);

router.post('/bookings/:id/refund', requireRole('visitor'), refundBooking);

router.get('/reviews', getReviews);
router.post('/reviews', requireRole('visitor'), createReview);

router.post('/payments/create-session', requireRole('visitor'), createPaymentSession);

router.post('/payments/stripe/capture', requireRole('visitor'), captureStripePayment);

router.post('/payments/paypal/create-order', requireRole('visitor'), createPayPalOrder);

router.post('/payments/paypal/capture-order', requireRole('visitor'), capturePayPalOrder);

// Follow / Following
router.get('/follows', requireRole('visitor'), listFollows);
router.post('/follows', requireRole('visitor'), followHost);
router.delete('/follows/:ehostId', requireRole('visitor'), unfollowHost);

// Public — anyone (logged in or not) can read a host's follower count;
// when logged in as a visitor we also tell them whether they follow.
router.get('/ehosts/:ehostId/follow-status', getFollowStatus);

module.exports = router;