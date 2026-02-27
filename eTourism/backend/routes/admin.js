const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const {
  getExperiences,
  deleteExperience,
  getBookings,
  getReviews,
} = require('../controllers/adminController');

// GET /api/admin/experiences
router.get('/experiences', requireAuth, getExperiences);

// DELETE /api/admin/experiences/:id
router.delete('/experiences/:id', requireAuth, deleteExperience);

// GET /api/admin/bookings
router.get('/bookings', requireAuth, getBookings);

// GET /api/admin/reviews
router.get('/reviews', requireAuth, getReviews);

module.exports = router;
