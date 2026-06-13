const { pool } = require('../db');

exports.getAlterations = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT
        ar.*,
        t.name as teacher_name
      FROM alteration_requests ar
      JOIN teachers t ON t.teacher_id = ar.requesting_teacher_id
    `;
    const params = [];
    if (status) {
      query += ` WHERE ar.status = $1`;
      params.push(status);
    }
    query += ` ORDER BY ar.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alterations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.approveAlteration = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { final_teacher_id } = req.body;

    const reqCheck = await client.query('SELECT * FROM alteration_requests WHERE id = $1', [id]);
    if (reqCheck.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (reqCheck.rows[0].status !== 'pending') return res.status(400).json({ error: 'Request already resolved' });

    const altReq = reqCheck.rows[0];

    const tCheck = await client.query('SELECT name FROM teachers WHERE teacher_id = $1', [final_teacher_id]);
    if (tCheck.rows.length === 0) return res.status(400).json({ error: 'Teacher ID not found' });
    const final_teacher_name = tCheck.rows[0].name;

    await client.query('BEGIN');

    await client.query(`
      UPDATE alteration_requests
      SET status = 'approved', final_teacher_id = $1, resolved_by = 'admin'
      WHERE id = $2
    `, [final_teacher_id, id]);

    await client.query(`
      UPDATE session_room_staff
      SET teacher_id = $1, teacher_name = $2
      WHERE session_id = $3 AND room_no = $4 AND teacher_id = $5
    `, [final_teacher_id, final_teacher_name, altReq.session_id, altReq.room_no, altReq.requesting_teacher_id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Alteration approved' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving alteration:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

exports.rejectAlteration = async (req, res) => {
  try {
    const { id } = req.params;

    const reqCheck = await pool.query('SELECT * FROM alteration_requests WHERE id = $1', [id]);
    if (reqCheck.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (reqCheck.rows[0].status !== 'pending') return res.status(400).json({ error: 'Request already resolved' });

    await pool.query(`
      UPDATE alteration_requests
      SET status = 'rejected', resolved_by = 'admin'
      WHERE id = $1
    `, [id]);

    res.json({ success: true, message: 'Alteration rejected' });
  } catch (error) {
    console.error('Error rejecting alteration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
