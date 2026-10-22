const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { logAudit } = require('../services/auditService');

/**
 * Get users with filtering
 */
async function getUsers(req, res) {
  try {
    const { role, department_id, ward_id, search, is_active } = req.query;

    let query = `
      SELECT u.id, u.name, u.email, u.role, u.phone, u.department_id, u.ward_id, u.badge_number, u.is_active, u.created_at,
             d.name AS department_name, d.code AS department_code,
             w.ward_number, w.ward_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN wards w ON u.ward_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }
    if (department_id) {
      query += ` AND u.department_id = ?`;
      params.push(department_id);
    }
    if (ward_id) {
      query += ` AND u.ward_id = ?`;
      params.push(ward_id);
    }
    if (is_active !== undefined) {
      query += ` AND u.is_active = ?`;
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }
    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.badge_number LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY u.created_at DESC`;

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[UserController.getUsers] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

/**
 * Create user (Admin only)
 */
async function createUser(req, res) {
  try {
    const { name, email, password, role, phone, department_id, ward_id, badge_number } = req.body;

    const [existing] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'Password@123', salt);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, department_id, ward_id, badge_number, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        role || 'citizen',
        phone || null,
        department_id || null,
        ward_id || null,
        badge_number || null
      ]
    );

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_CREATE_USER',
      entityType: 'user',
      entityId: result.insertId,
      details: { email, role },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      userId: result.insertId
    });
  } catch (error) {
    console.error('[UserController.createUser] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
}

/**
 * Update user (Admin only or self)
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, role, department_id, ward_id, badge_number, is_active, password } = req.body;

    // Check target exists
    const [existing] = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Permission: Only admin can edit role/department/badge or edit other users
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id, 10)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    let query = `UPDATE users SET name = ?, phone = ?`;
    const params = [name || existing[0].name, phone !== undefined ? phone : existing[0].phone];

    if (req.user.role === 'admin') {
      query += `, role = ?, department_id = ?, ward_id = ?, badge_number = ?, is_active = ?`;
      params.push(
        role || existing[0].role,
        department_id !== undefined ? department_id : existing[0].department_id,
        ward_id !== undefined ? ward_id : existing[0].ward_id,
        badge_number !== undefined ? badge_number : existing[0].badge_number,
        is_active !== undefined ? (is_active ? 1 : 0) : existing[0].is_active
      );
    }

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query += `, password = ?`;
      params.push(hashedPassword);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.query(query, params);

    await logAudit({
      userId: req.user.id,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: id,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    console.error('[UserController.updateUser] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

/**
 * Delete / deactivate user (Admin only)
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own administrative account.' });
    }

    await pool.query(`UPDATE users SET is_active = FALSE WHERE id = ?`, [id]);

    await logAudit({
      userId: req.user.id,
      action: 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: id,
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'User account has been deactivated.' });
  } catch (error) {
    console.error('[UserController.deleteUser] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}

/**
 * Get all departments
 */
async function getDepartments(req, res) {
  try {
    const [rows] = await pool.query(`SELECT * FROM departments ORDER BY name ASC`);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[UserController.getDepartments] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
}

/**
 * Get all wards
 */
async function getWards(req, res) {
  try {
    const [rows] = await pool.query(`SELECT * FROM wards ORDER BY ward_number ASC`);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[UserController.getWards] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch wards.' });
  }
}

/**
 * Get all issue categories
 */
async function getCategories(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, d.name AS default_department_name 
      FROM issue_categories c
      LEFT JOIN departments d ON c.default_department_id = d.id
      ORDER BY c.id ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[UserController.getCategories] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDepartments,
  getWards,
  getCategories
};
