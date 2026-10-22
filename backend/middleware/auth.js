const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Middleware to authenticate JWT token
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_civic_gis_2026_xyz');
    
    // Fetch full active user details
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.department_id, u.ward_id, u.badge_number, u.is_active,
              d.name AS department_name, d.code AS department_code,
              w.ward_number, w.ward_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN wards w ON u.ward_id = w.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or account is deactivated.'
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token.' });
  }
}

/**
 * Middleware to authorize specific user roles
 * @param {string[]} roles - Allowed roles e.g. ['admin', 'officer']
 */
function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You do not have permission to perform this action. Required role: ${roles.join(' or ')}.`
      });
    }

    next();
  };
}

module.exports = { authenticateToken, authorize };
