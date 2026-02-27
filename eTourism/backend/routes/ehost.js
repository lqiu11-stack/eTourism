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

// POST /api/ehost/experiences
router.post('/experiences', requireAuth, createExperience);

// GET /api/ehost/experiences
router.get('/experiences', requireAuth, getExperiences);

// GET /api/ehost/experiences/:id
router.get('/experiences/:id', requireAuth, getExperienceById);

// PUT /api/ehost/experiences/:id
router.put('/experiences/:id', requireAuth, updateExperience);

// DELETE /api/ehost/experiences/:id
router.delete('/experiences/:id', requireAuth, deleteExperience);

// GET /api/ehost/bookings
router.get('/bookings', requireAuth, getBookings);

module.exports = router;
