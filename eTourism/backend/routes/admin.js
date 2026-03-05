const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const {
  getExperiences,
  deleteExperience,
  getBookings,
  getReviews,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
} = require('../controllers/adminController');

// GET /api/admin/experiences
router.get('/experiences', requireAuth, getExperiences);

// DELETE /api/admin/experiences/:id
router.delete('/experiences/:id', requireAuth, deleteExperience);

// GET /api/admin/bookings
router.get('/bookings', requireAuth, getBookings);

// GET /api/admin/reviews
router.get('/reviews', requireAuth, getReviews);

// --- User Management ---

// GET /api/admin/users?role=&status=
router.get('/users', requireAuth, getUsers);

// GET /api/admin/users/:id
router.get('/users/:id', requireAuth, getUserById);

// PATCH /api/admin/users/:id/status  — suspend or reactivate
router.patch('/users/:id/status', requireAuth, updateUserStatus);

// PATCH /api/admin/users/:id/role   — change role
router.patch('/users/:id/role', requireAuth, updateUserRole);

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAuth, deleteUser);

module.exports = router;
