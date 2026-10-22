const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { logAudit } = require('../services/auditService');

/**
 * Register a new user
 */
async function register(req, res) {
  try {
    const { name, email, password, phone, role, department_id, ward_id, badge_number } = req.body;

    // Check if email already exists
    const [existing] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Role restrictions: public register is always 'citizen' unless an authenticated admin is creating
    let assignedRole = 'citizen';
    if (req.user && req.user.role === 'admin' && role) {
      assignedRole = ['admin', 'officer', 'citizen'].includes(role) ? role : 'citizen';
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, department_id, ward_id, badge_number, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        assignedRole,
        phone || null,
        department_id || null,
        ward_id || null,
        badge_number || null
      ]
    );

    const newUserId = result.insertId;

    // Generate JWT token
    const token = jwt.sign(
      { id: newUserId, email: email.toLowerCase().trim(), role: assignedRole },
      process.env.JWT_SECRET || 'super_secret_jwt_key_civic_gis_2026_xyz',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAudit({
      userId: newUserId,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: newUserId,
      details: { email, role: assignedRole },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: assignedRole,
        phone: phone || null,
        department_id: department_id || null,
        ward_id: ward_id || null,
        badge_number: badge_number || null
      }
    });
  } catch (error) {
    console.error('[AuthController.register] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while registering user.' });
  }
}

/**
 * Log in an existing user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.phone, u.department_id, u.ward_id, u.badge_number, u.is_active,
              d.name AS department_name, d.code AS department_code,
              w.ward_number, w.ward_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN wards w ON u.ward_id = w.id
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact municipal support.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_civic_gis_2026_xyz',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      details: { role: user.role },
      ipAddress: req.ip
    });

    const userObj = { ...user };
    delete userObj.password;

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('[AuthController.login] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

/**
 * Get current authenticated user profile
 */
async function getMe(req, res) {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('[AuthController.getMe] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
}

module.exports = { register, login, getMe };
