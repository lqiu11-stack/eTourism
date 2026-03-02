const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  getBookings,
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

// GET /api/ehost/bookings
router.get('/bookings', requireAuth, requireRole('ehost'), getBookings);

module.exports = router;
