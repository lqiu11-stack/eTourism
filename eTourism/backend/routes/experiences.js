const router = require('express').Router();
const { getAllExperiences, getExperienceLocationById } = require('../controllers/experiencesController');

// GET /api/experiences
router.get('/', getAllExperiences);

// GET /api/experiences/:id/location
router.get('/:id/location', getExperienceLocationById);

module.exports = router;
