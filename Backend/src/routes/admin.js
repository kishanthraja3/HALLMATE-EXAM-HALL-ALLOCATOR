const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');

router.get('/alterations', ctrl.getAlterations);
router.post('/alterations/:id/approve', ctrl.approveAlteration);
router.post('/alterations/:id/reject', ctrl.rejectAlteration);

module.exports = router;
