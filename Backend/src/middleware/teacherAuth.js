const jwt = require('jsonwebtoken');

const teacherAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.TEACHER_JWT_SECRET);
    if (decoded.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.teacher = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = teacherAuth;
