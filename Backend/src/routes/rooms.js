const express = require('express');
const router = express.Router();
const { getRoomLayout } = require('../controllers/roomController');

router.get('/:room_no', getRoomLayout);

module.exports = router;
