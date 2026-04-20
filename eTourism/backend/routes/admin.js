const router = require('express').Router();
const { requireRole, requireAuth} = require('../middleware/auth');
const {
  getExperiences,
  approveExperience,
  rejectExperience,
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
  getNetworkLogs,
  getNetworkIssueStats,
  reportNetworkIssue,
  getAnalytics,
  scoreExperience,
  getExperienceScores,
} = require('../controllers/adminController');

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

// 1. Retrieve a list of all network logs (viewable only by Admin)
router.get('/network-logs', requireRole('admin'), getNetworkLogs);

// 2. Retrieve aggregated statistics on network issues (also only for Admin)
router.get('/network-logs/stats', requireRole('admin'), getNetworkIssueStats);

// 3. Retrieve network issue reports (viewable only by Admin)
router.post('/network-logs/report', requireRole('admin'), reportNetworkIssue);

// GET /api/admin/analytics
router.get('/analytics', requireRole('admin'), getAnalytics);

// POST /api/admin/experiences/:id/score
router.post('/experiences/:id/score', requireRole('admin'), scoreExperience);

// GET /api/admin/experiences/:id/scores
router.get('/experiences/:id/scores', requireRole('admin'), getExperienceScores);


module.exports = router;
