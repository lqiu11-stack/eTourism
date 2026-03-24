const router = require('express').Router();
const { requireRole, validateApplication } = require('../middleware/auth');
const {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  getBookings,
} = require('../controllers/ehostController');

// POST /api/ehost/experiences
router.post('/experiences', requireRole('ehost'), createExperience);

// GET /api/ehost/experiences
router.get('/experiences', requireRole('ehost'), getExperiences);

// GET /api/ehost/experiences/:id
router.get('/experiences/:id', requireRole('ehost'), getExperienceById);

// PUT /api/ehost/experiences/:id
router.put('/experiences/:id', requireRole('ehost'), updateExperience);

// DELETE /api/ehost/experiences/:id
router.delete('/experiences/:id', requireRole('ehost'), deleteExperience);

// GET /api/ehost/bookings
router.get('/bookings', requireRole('ehost'), getBookings);




//3-4 update ehost registionation and login by Emily
const express = require('express');
const { submitApplication } = require('../controllers/ehostController');

router.post('/apply', validateApplication, submitApplication);
module.exports = router;