const router = require('express').Router();

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const visitorRoutes = require('./visitor');
const ehostRoutes = require('./ehost');

//ehost part
router.use('/ehosts', require('./ehost'));
//ehost end

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/visitor', visitorRoutes);
router.use('/ehost', ehostRoutes);

module.exports = router;

