const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  getBookings,
} = require('../controllers/ehostController');


router.post('/experiences', requireAuth, createExperience);
router.get('/experiences', requireAuth, getExperiences);
router.get('/experiences/:id', requireAuth, getExperienceById);
router.put('/experiences/:id', requireAuth, updateExperience);
router.delete('/experiences/:id', requireAuth, deleteExperience);
router.get('/bookings', requireAuth, getBookings);

module.exports = router;


//3-4 update ehost registionation and login by Emily
const express = require('express');
const { submitApplication } = require('../controllers/ehostController');
const { validateApplication } = require('../middleware/validateApplication');
router.post('/apply', validateApplication, submitApplication);

module.exports = router;

const express = require('express');


// 3-5  ehost management experiences edit by Emily
const express = require('express');
const ehostController = require('../controllers/ehostController');
const authMiddleware = require('../middleware/auth');


router.get('/experiences', authMiddleware, ehostController.getMyExperiences);
router.get('/experiences/:id', authMiddleware, ehostController.getExperienceById);
router.put('/experiences/:id', authMiddleware, ehostController.updateExperience);
router.delete('/experiences/:id', authMiddleware, ehostController.deactivateExperience);

module.exports = router;