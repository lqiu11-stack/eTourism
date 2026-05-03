const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
const {
  getAgreement,
  acceptAgreement,
  getExperiences,
  approveExperience,
  rejectExperience,
  deleteExperience,
  getBookings,
  getApplications,
  approveApplication,
  rejectApplication,
  createUser,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAnalytics,
  scoreExperience,
  getExperienceScores,
  getRefunds,
  approveRefund,
  rejectRefund,
} = require('../controllers/adminController');

router.get('/agreements', getAgreement);
router.post('/agreements/accept', acceptAgreement);

// GET /api/admin/applications?status=pending
router.get('/applications', requireRole('admin'), getApplications);

// PATCH /api/admin/applications/:id/approve
router.patch('/applications/:id/approve', requireRole('admin'), approveApplication);

// PATCH /api/admin/applications/:id/reject
router.patch('/applications/:id/reject', requireRole('admin'), rejectApplication);

// GET /api/admin/experiences
router.get('/experiences', requireRole('admin'), getExperiences);

// PATCH /api/admin/experiences/:id/approve
router.patch('/experiences/:id/approve', requireRole('admin'), approveExperience);

// PATCH /api/admin/experiences/:id/reject
router.patch('/experiences/:id/reject', requireRole('admin'), rejectExperience);

// DELETE /api/admin/experiences/:id
router.delete('/experiences/:id', requireRole('admin'), deleteExperience);

// GET /api/admin/bookings
router.get('/bookings', requireRole('admin'), getBookings);

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

// GET /api/admin/analytics
router.get('/analytics', requireRole('admin'), getAnalytics);

// GET /api/admin/refunds?status=pending
router.get('/refunds', requireRole('admin'), getRefunds);

// PATCH /api/admin/refunds/:id/approve
router.patch('/refunds/:id/approve', requireRole('admin'), approveRefund);

// PATCH /api/admin/refunds/:id/reject
router.patch('/refunds/:id/reject', requireRole('admin'), rejectRefund);

// POST /api/admin/experiences/:id/score
router.post('/experiences/:id/score', requireRole('admin'), scoreExperience);

// GET /api/admin/experiences/:id/scores
router.get('/experiences/:id/scores', requireRole('admin'), getExperienceScores);

module.exports = router;
