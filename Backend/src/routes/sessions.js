const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ctrl = require('../controllers/sessionController');

router.post('/check-slot', ctrl.checkSlot);
router.post('/', upload.fields([
  { name: 'students', maxCount: 1 },
  { name: 'teachers', maxCount: 1 },
  { name: 'rooms', maxCount: 1 }
]), ctrl.createSession);
router.post('/:id/allocate', ctrl.runAllocation);
router.post('/:id/publish', ctrl.publishAllocation);
router.get('/', ctrl.listSessions);
router.get('/:id', ctrl.getSession);
router.get('/:id/download/room-range', ctrl.downloadRoomRange);
router.get('/:id/download/staff', ctrl.downloadStaff);
router.get('/:id/download/seat-map', ctrl.downloadSeatMap);

module.exports = router;
