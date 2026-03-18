const router = require('express').Router();
const { requireAuth, requireRole, validateApplication } = require('../middleware/auth');
const {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  getBookings,
  getExperienceMeetingLink,
  upsertExperienceMeetingLink,
  getExperienceBookingPreferences,
  upsertExperienceBookingPreferences,
} = require('../controllers/ehostController');

// POST /api/ehost/experiences
router.post('/experiences', requireAuth, requireRole('ehost'), createExperience);

// GET /api/ehost/experiences
router.get('/experiences', requireAuth, requireRole('ehost'), getExperiences);

// GET /api/ehost/experiences/:id
router.get('/experiences/:id', requireAuth, requireRole('ehost'), getExperienceById);

// PUT /api/ehost/experiences/:id
router.put('/experiences/:id', requireAuth, requireRole('ehost'), updateExperience);

// DELETE /api/ehost/experiences/:id
router.delete('/experiences/:id', requireAuth, requireRole('ehost'), deleteExperience);

// GET /api/ehost/experiences/:id/meeting-link
router.get('/experiences/:id/meeting-link', requireAuth, requireRole('ehost'), getExperienceMeetingLink);

// PUT /api/ehost/experiences/:id/meeting-link
router.put('/experiences/:id/meeting-link', requireAuth, requireRole('ehost'), upsertExperienceMeetingLink);

// GET /api/ehost/experiences/:id/booking-preferences
router.get('/experiences/:id/booking-preferences', requireAuth, requireRole('ehost'), getExperienceBookingPreferences);

// PUT /api/ehost/experiences/:id/booking-preferences
router.put('/experiences/:id/booking-preferences', requireAuth, requireRole('ehost'), upsertExperienceBookingPreferences);

// GET /api/ehost/bookings
router.get('/bookings', requireAuth, requireRole('ehost'), getBookings);




//3-4 update ehost registionation and login by Emily
const express = require('express');
const { submitApplication } = require('../controllers/ehostController');

router.post('/apply', validateApplication, submitApplication);
module.exports = router;
