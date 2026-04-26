const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  logIssue,
  getMyQuality,
  getExperienceQuality,
  getAdminSummary,
} = require('../controllers/networkController');

router.post('/', requireAuth, logIssue);
router.get('/me', requireAuth, getMyQuality);
router.get('/experience/:id', requireAuth, getExperienceQuality);
router.get('/admin/summary', requireRole('admin'), getAdminSummary);

module.exports = router;
