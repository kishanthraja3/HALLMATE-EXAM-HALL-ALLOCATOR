const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const studentAuth = require('../middleware/studentAuth');

router.post('/login', ctrl.login);
router.get('/profile', studentAuth, ctrl.getProfile);
router.get('/allocation', studentAuth, ctrl.getAllocation);
router.get('/timetable', studentAuth, ctrl.getTimetable);
router.post('/change-password', studentAuth, ctrl.changePassword);

module.exports = router;
