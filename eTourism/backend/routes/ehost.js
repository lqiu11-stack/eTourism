const router = require('express').Router();
const { requireRole, validateApplication } = require('../middleware/auth');
const {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  getBookings,
  getCalendarSlots,
  createCalendarSlot,
  updateCalendarSlot,
  deleteCalendarSlot,
  setUnavailableDates,
  updateBookingMeetingLink,
  getBookingPreferences,
  updateBookingPreferences,
  getMe,
  updateMe,
  submitApplication,
} = require('../controllers/ehostController');

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

router.get('/calendar/slots', requireRole('ehost'), getCalendarSlots);

router.post('/calendar/slots', requireRole('ehost'), createCalendarSlot);

router.put('/calendar/slots/:id', requireRole('ehost'), updateCalendarSlot);

router.delete('/calendar/slots/:id', requireRole('ehost'), deleteCalendarSlot);

router.post('/calendar/unavailable-dates', requireRole('ehost'), setUnavailableDates);

// PATCH /api/ehost/bookings/:id/meeting-link
router.patch('/bookings/:id/meeting-link', requireRole('ehost'), updateBookingMeetingLink);

// GET /api/ehost/me
router.get('/me', requireRole('ehost'), getMe);

// PATCH /api/ehost/me
router.patch('/me', requireRole('ehost'), updateMe);


router.post('/apply', validateApplication, submitApplication);
module.exports = router;
