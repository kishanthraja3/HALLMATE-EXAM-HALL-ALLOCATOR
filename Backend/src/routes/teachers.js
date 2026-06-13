const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/teacherController');
const teacherAuth = require('../middleware/teacherAuth');

router.post('/login', ctrl.login);
router.get('/profile', teacherAuth, ctrl.getProfile);
router.get('/duty', teacherAuth, ctrl.getDuty);
router.get('/duty/download', teacherAuth, ctrl.downloadStudentList);
router.post('/alteration', teacherAuth, ctrl.requestAlteration);
router.get('/alteration/history', teacherAuth, ctrl.getAlterationHistory);
router.post('/change-password', teacherAuth, ctrl.changePassword);

module.exports = router;
