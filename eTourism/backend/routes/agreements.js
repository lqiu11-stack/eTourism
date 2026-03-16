const router = require('express').Router();
const { getAgreement, acceptAgreement } = require('../controllers/agreementController');

router.get('/', getAgreement);
router.post('/accept', acceptAgreement);

module.exports = router;
