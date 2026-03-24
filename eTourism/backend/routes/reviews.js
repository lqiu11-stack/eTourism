const router = require('express').Router();
const {
  sendReviewEmail,
  verifyReviewToken,
  submitReview,
} = require('../controllers/reviewController');

router.get('/verify', verifyReviewToken);
router.post('/send-email', sendReviewEmail);
router.post('/', submitReview);

module.exports = router;
