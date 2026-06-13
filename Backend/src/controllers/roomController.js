const db = require('../db');

const getRoomLayout = async (req, res, next) => {
  try {
    const { room_no } = req.params;
    const result = await db.query(
      'SELECT * FROM rooms WHERE room_no = $1',
      [room_no]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: `Room ${room_no} not found in database` });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRoomLayout };
