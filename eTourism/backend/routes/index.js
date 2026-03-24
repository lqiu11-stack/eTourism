const router = require('express').Router();

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const visitorRoutes = require('./visitor');
const ehostRoutes = require('./ehost');
const reviewsRoutes = require('./reviews');
const experiencesRoutes = require('./experiences');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/visitor', visitorRoutes);
router.use('/ehost', ehostRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/experiences', experiencesRoutes);

module.exports = router;
