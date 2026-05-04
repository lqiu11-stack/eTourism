const router = require('express').Router();
const { requireRole, validateApplication } = require('../middleware/auth');
const {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  getBookings,
  getBookingsByExperience,
  getCalendarSlots,
  createCalendarSlot,
  updateCalendarSlot,
  deleteCalendarSlot,
  setUnavailableDates,
  getBookingPreferences,
  updateBookingPreferences,
  getMe,
  updateMe,
  submitApplication,
} = require('../controllers/ehostController');
const { listMyTips } = require('../controllers/tipController');

// POST /api/ehost/experiences
router.post('/experiences', requireRole('ehost'), createExperience);

// GET /api/ehost/experiences
router.get('/experiences', requireRole('ehost'), getExperiences);

// GET /api/ehost/experiences/:id
router.get('/experiences/:id', requireRole('ehost'), getExperienceById);

// PUT /api/ehost/experiences/:id
router.put('/experiences/:id', requireRole('ehost'), updateExperience);

// GET /api/ehost/experiences/:id/booking-preferences
router.get('/experiences/:id/booking-preferences', requireRole('ehost'), getBookingPreferences);

// PATCH /api/ehost/experiences/:id/booking-preferences
router.patch('/experiences/:id/booking-preferences', requireRole('ehost'), updateBookingPreferences);

// DELETE /api/ehost/experiences/:id
router.delete('/experiences/:id', requireRole('ehost'), deleteExperience);

// GET /api/ehost/bookings
router.get('/bookings', requireRole('ehost'), getBookings);

// GET /api/ehost/experiences/:id/bookings
router.get('/experiences/:id/bookings', requireRole('ehost'), getBookingsByExperience);

router.get('/calendar/slots', requireRole('ehost'), getCalendarSlots);

router.post('/calendar/slots', requireRole('ehost'), createCalendarSlot);

router.put('/calendar/slots/:id', requireRole('ehost'), updateCalendarSlot);

router.delete('/calendar/slots/:id', requireRole('ehost'), deleteCalendarSlot);

router.post('/calendar/unavailable-dates', requireRole('ehost'), setUnavailableDates);

// GET /api/ehost/me
router.get('/me', requireRole('ehost'), getMe);

// PATCH /api/ehost/me
router.patch('/me', requireRole('ehost'), updateMe);


router.post('/apply', validateApplication, submitApplication);

// Tips received by this eHost
router.get('/tips', requireRole('ehost'), listMyTips);

module.exports = router;
