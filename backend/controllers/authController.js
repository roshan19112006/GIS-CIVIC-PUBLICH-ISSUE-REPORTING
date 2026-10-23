const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { logAudit } = require('../services/auditService');

/**
 * Register a new user
 */
async function register(req, res) {
  try {
    let { name, email, password, phone, role, department_id, ward_id, badge_number } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // Check if email already exists
    const [existing] = await pool.query(`SELECT id FROM users WHERE LOWER(email) = ?`, [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in or use another email.'
      });
    }

    // Role restrictions: public register is always 'citizen' unless an authenticated admin is creating
    let assignedRole = 'citizen';
    if (req.user && req.user.role === 'admin' && role) {
      assignedRole = ['admin', 'officer', 'citizen'].includes(role) ? role : 'citizen';
    }

    // Validate ward_id if provided
    let validWardId = null;
    if (ward_id !== undefined && ward_id !== null && ward_id !== '') {
      const parsedWard = parseInt(ward_id, 10);
      if (!isNaN(parsedWard)) {
        const [wCheck] = await pool.query(`SELECT id FROM wards WHERE id = ?`, [parsedWard]);
        if (wCheck.length > 0) {
          validWardId = parsedWard;
        }
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, department_id, ward_id, badge_number, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        name.trim(),
        cleanEmail,
        hashedPassword,
        assignedRole,
        phone ? String(phone).trim().slice(0, 20) : null,
        department_id || null,
        validWardId,
        badge_number || null
      ]
    );

    const newUserId = result.insertId;

    // Generate JWT token
    const token = jwt.sign(
      { id: newUserId, email: cleanEmail, role: assignedRole },
      process.env.JWT_SECRET || 'super_secret_jwt_key_civic_gis_2026_xyz',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAudit({
      userId: newUserId,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: newUserId,
      details: { email: cleanEmail, role: assignedRole },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        role: assignedRole,
        phone: phone ? String(phone).trim().slice(0, 20) : null,
        department_id: department_id || null,
        ward_id: validWardId,
        badge_number: badge_number || null
      }
    });
  } catch (error) {
    console.error('[AuthController.register] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.sqlMessage || 'Internal server error while registering user.'
    });
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
