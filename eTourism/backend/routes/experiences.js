const router = require('express').Router();
const { getExperienceReviews } = require('../controllers/reviewController');

router.get('/:id/reviews', getExperienceReviews);

module.exports = router;
