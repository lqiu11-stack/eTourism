const router = require('express').Router();

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const visitorRoutes = require('./visitor');
const ehostRoutes = require('./ehost');
const agreementsRoutes = require('./agreements');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/visitor', visitorRoutes);
router.use('/ehost', ehostRoutes);
router.use('/agreements', agreementsRoutes);

module.exports = router;
