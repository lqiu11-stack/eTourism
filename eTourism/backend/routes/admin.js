const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getExperiences,
  deleteExperience,
  getBookings,
  getReviews,
} = require('../controllers/adminController');

// GET /api/admin/experiences
router.get('/experiences', requireAuth, requireRole('admin'), getExperiences);

// DELETE /api/admin/experiences/:id
router.delete('/experiences/:id', requireAuth, requireRole('admin'), deleteExperience);

// GET /api/admin/bookings
router.get('/bookings', requireAuth, requireRole('admin'), getBookings);

// GET /api/admin/reviews
router.get('/reviews', requireAuth, requireRole('admin'), getReviews);

module.exports = router;
