const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
const {
  getExperiences,
  deleteExperience,
  getBookings,
  getReviews,
  getApplications,
  approveApplication,
  rejectApplication,
  createUser,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
} = require('../controllers/adminController');

// GET /api/admin/applications?status=pending
router.get('/applications', requireRole('admin'), getApplications);

// PATCH /api/admin/applications/:id/approve
router.patch('/applications/:id/approve', requireRole('admin'), approveApplication);

// PATCH /api/admin/applications/:id/reject
router.patch('/applications/:id/reject', requireRole('admin'), rejectApplication);

// GET /api/admin/experiences
router.get('/experiences', requireRole('admin'), getExperiences);

// DELETE /api/admin/experiences/:id
router.delete('/experiences/:id', requireRole('admin'), deleteExperience);

// GET /api/admin/bookings
router.get('/bookings', requireRole('admin'), getBookings);

// GET /api/admin/reviews
router.get('/reviews', requireRole('admin'), getReviews);

// POST /api/admin/users
router.post('/users', requireRole('admin'), createUser);

// GET /api/admin/users?role=&status=
router.get('/users', requireRole('admin'), getUsers);

// GET /api/admin/users/:id
router.get('/users/:id', requireRole('admin'), getUserById);

// PATCH /api/admin/users/:id/status  — suspend or reactivate
router.patch('/users/:id/status', requireRole('admin'), updateUserStatus);

// PATCH /api/admin/users/:id/role   — change role
router.patch('/users/:id/role', requireRole('admin'), updateUserRole);

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireRole('admin'), deleteUser);

module.exports = router;
