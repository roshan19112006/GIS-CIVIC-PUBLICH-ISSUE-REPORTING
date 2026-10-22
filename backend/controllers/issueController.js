const pool = require('../config/db');
const { logAudit } = require('../services/auditService');
const { createNotification, notifyAdmins } = require('../services/notificationService');

/**
 * Generate unique ticket ID: TKT-YYYYMMDD-XXXX
 */
function generateTicketId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${dateStr}-${randomChars}`;
}

/**
 * Get civic issues with comprehensive filtering and RBAC
 */
async function getIssues(req, res) {
  try {
    const {
      status,
      category_id,
      department_id,
      ward_id,
      priority,
      search,
      citizen_id,
      mine,
      start_date,
      end_date,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // RBAC logic
    if (req.user) {
      if (req.user.role === 'citizen' && (mine === 'true' || citizen_id)) {
        whereClause += ' AND i.citizen_id = ?';
        params.push(req.user.id);
      } else if (req.user.role === 'officer' && mine === 'true') {
        // Officer viewing their own assigned work orders
        whereClause += ' AND wo.officer_id = ?';
        params.push(req.user.id);
      }
    }

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }
    if (category_id) {
      whereClause += ' AND i.category_id = ?';
      params.push(category_id);
    }
    if (department_id) {
      whereClause += ' AND i.department_id = ?';
      params.push(department_id);
    }
    if (ward_id) {
      whereClause += ' AND i.ward_id = ?';
      params.push(ward_id);
    }
    if (priority) {
      whereClause += ' AND i.priority = ?';
      params.push(priority);
    }
    if (start_date) {
      whereClause += ' AND i.created_at >= ?';
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      whereClause += ' AND i.created_at <= ?';
      params.push(`${end_date} 23:59:59`);
    }
    if (search) {
      whereClause += ' AND (i.ticket_id LIKE ? OR i.title LIKE ? OR i.description LIKE ? OR i.address LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    // Count total query
    const countQuery = `
      SELECT COUNT(DISTINCT i.id) AS total
      FROM issues i
      LEFT JOIN work_orders wo ON i.id = wo.issue_id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Allowed sort columns
    const allowedSort = ['created_at', 'updated_at', 'priority', 'status', 'deadline', 'id'];
    const safeSortBy = allowedSort.includes(sort_by) ? `i.${sort_by}` : 'i.created_at';
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const queryParams = [...params, parseInt(limit, 10), offset];

    const dataQuery = `
      SELECT i.id, i.ticket_id, i.citizen_id, i.category_id, i.department_id, i.ward_id,
             i.title, i.description, i.latitude, i.longitude, i.location_type, i.address,
             i.priority, i.status, i.deadline, i.created_at, i.updated_at,
             c.name AS category_name, c.color_code AS category_color, c.icon AS category_icon,
             d.name AS department_name, d.code AS department_code,
             w.ward_number, w.ward_name,
             u.name AS citizen_name, u.email AS citizen_email, u.phone AS citizen_phone,
             off.id AS officer_id, off.name AS officer_name, off.badge_number AS officer_badge,
             wo.id AS work_order_id, wo.status AS work_order_status,
             (SELECT image_url FROM issue_images WHERE issue_id = i.id AND image_type = 'complaint' LIMIT 1) AS thumbnail_url,
             (SELECT image_url FROM issue_images WHERE issue_id = i.id AND image_type = 'resolution' LIMIT 1) AS resolution_thumbnail_url,
             (SELECT rating FROM feedback WHERE issue_id = i.id LIMIT 1) AS citizen_rating
      FROM issues i
      LEFT JOIN issue_categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN wards w ON i.ward_id = w.id
      LEFT JOIN users u ON i.citizen_id = u.id
      LEFT JOIN work_orders wo ON (i.id = wo.issue_id AND wo.id = (SELECT MAX(id) FROM work_orders WHERE issue_id = i.id))
      LEFT JOIN users off ON wo.officer_id = off.id
      ${whereClause}
      GROUP BY i.id
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataQuery, queryParams);

    return res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: rows
    });
  } catch (error) {
    console.error('[IssueController.getIssues] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve civic issues.' });
  }
}

/**
 * Get single civic issue by ID or Ticket ID
 */
async function getIssueById(req, res) {
  try {
    const { id } = req.params;

    const isNumeric = /^\d+$/.test(id);
    const whereCond = isNumeric ? 'i.id = ?' : 'i.ticket_id = ?';

    const [issues] = await pool.query(
      `SELECT i.*, 
              c.name AS category_name, c.color_code AS category_color, c.icon AS category_icon, c.sla_hours,
              d.name AS department_name, d.code AS department_code, d.contact_email AS department_email,
              w.ward_number, w.ward_name, w.zone AS ward_zone, w.councillor_name,
              u.name AS citizen_name, u.email AS citizen_email, u.phone AS citizen_phone
       FROM issues i
       LEFT JOIN issue_categories c ON i.category_id = c.id
       LEFT JOIN departments d ON i.department_id = d.id
       LEFT JOIN wards w ON i.ward_id = w.id
       LEFT JOIN users u ON i.citizen_id = u.id
       WHERE ${whereCond}`,
      [id]
    );

    if (!issues.length) {
      return res.status(404).json({ success: false, message: 'Civic issue not found.' });
    }

    const issue = issues[0];

    // Images
    const [images] = await pool.query(
      `SELECT img.*, u.name AS uploader_name, u.role AS uploader_role
       FROM issue_images img
       LEFT JOIN users u ON img.uploaded_by = u.id
       WHERE img.issue_id = ?
       ORDER BY img.created_at ASC`,
      [issue.id]
    );

    // Work orders
    const [workOrders] = await pool.query(
      `SELECT wo.*, 
              off.name AS officer_name, off.email AS officer_email, off.phone AS officer_phone, off.badge_number,
              admin.name AS assigned_by_name,
              dept.name AS department_name
       FROM work_orders wo
       LEFT JOIN users off ON wo.officer_id = off.id
       LEFT JOIN users admin ON wo.assigned_by = admin.id
       LEFT JOIN departments dept ON wo.department_id = dept.id
       WHERE wo.issue_id = ?
       ORDER BY wo.created_at DESC`,
      [issue.id]
    );

    // Status History
    const [statusHistory] = await pool.query(
      `SELECT sh.*, u.name AS changed_by_name, u.role AS changed_by_role
       FROM issue_status_history sh
       LEFT JOIN users u ON sh.changed_by = u.id
       WHERE sh.issue_id = ?
       ORDER BY sh.created_at ASC`,
      [issue.id]
    );

    // Resolution details
    const [resolutions] = await pool.query(
      `SELECT r.*, u.name AS resolved_by_name, u.badge_number AS resolved_by_badge
       FROM resolutions r
       LEFT JOIN users u ON r.resolved_by = u.id
       WHERE r.issue_id = ?`,
      [issue.id]
    );

    // Feedback
    const [feedback] = await pool.query(
      `SELECT f.*, u.name AS citizen_name
       FROM feedback f
       LEFT JOIN users u ON f.citizen_id = u.id
       WHERE f.issue_id = ?`,
      [issue.id]
    );

    return res.json({
      success: true,
      data: {
        ...issue,
        images,
        work_orders: workOrders,
        current_work_order: workOrders[0] || null,
        status_history: statusHistory,
        resolution: resolutions[0] || null,
        feedback: feedback[0] || null
      }
    });
  } catch (error) {
    console.error('[IssueController.getIssueById] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve issue details.' });
  }
}

/**
 * Create a new civic issue (Citizen or Admin)
 */
async function createIssue(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      title,
      description,
      category_id,
      department_id,
      ward_id,
      latitude,
      longitude,
      location_type = 'gps',
      address,
      priority
    } = req.body;

    if (!title || !description || !category_id || !latitude || !longitude) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, latitude, and longitude are required.'
      });
    }

    // Verify category exists and get defaults
    const [categories] = await connection.query(
      `SELECT * FROM issue_categories WHERE id = ?`,
      [category_id]
    );

    if (!categories.length) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Invalid category selected.' });
    }

    const category = categories[0];
    const assignedDeptId = department_id || category.default_department_id || null;
    const assignedPriority = priority || category.default_priority || 'medium';

    // Calculate initial SLA deadline
    const slaHours = category.sla_hours || 48;
    const deadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const ticketId = generateTicketId();
    const citizenId = req.user.id;

    // Insert issue
    const [issueResult] = await connection.query(
      `INSERT INTO issues (ticket_id, citizen_id, category_id, department_id, ward_id, title, description, 
                           latitude, longitude, location_type, address, priority, status, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        ticketId,
        citizenId,
        category_id,
        assignedDeptId,
        ward_id || null,
        title.trim(),
        description.trim(),
        parseFloat(latitude),
        parseFloat(longitude),
        location_type,
        address ? address.trim() : null,
        assignedPriority,
        deadline
      ]
    );

    const issueId = issueResult.insertId;

    // Handle image upload if provided
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      await connection.query(
        `INSERT INTO issue_images (issue_id, image_url, image_type, uploaded_by, caption, file_size)
         VALUES (?, ?, 'complaint', ?, ?, ?)`,
        [issueId, imageUrl, citizenId, 'Initial complaint photograph', req.file.size]
      );
    }

    // Status History entry
    await connection.query(
      `INSERT INTO issue_status_history (issue_id, changed_by, previous_status, new_status, remarks)
       VALUES (?, ?, NULL, 'pending', 'Complaint submitted by citizen with coordinates')`,
      [issueId, citizenId]
    );

    await connection.commit();

    // Create notifications outside transaction
    await createNotification({
      userId: citizenId,
      issueId,
      title: 'Complaint Registered Successfully',
      message: `Your complaint has been logged with Ticket #${ticketId}. Our municipal team will review and assign it shortly.`,
      type: 'info'
    });

    await notifyAdmins({
      issueId,
      title: 'New Civic Issue Reported',
      message: `New complaint #${ticketId} - "${title}" registered in ${category.name}.`,
      type: 'info'
    });

    await logAudit({
      userId: citizenId,
      action: 'ISSUE_CREATED',
      entityType: 'issue',
      entityId: issueId,
      details: { ticket_id: ticketId, title, category: category.name },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      issue: {
        id: issueId,
        ticket_id: ticketId,
        title,
        status: 'pending',
        priority: assignedPriority,
        imageUrl,
        deadline
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('[IssueController.createIssue] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create civic complaint.' });
  } finally {
    connection.release();
  }
}

/**
 * Update an existing issue (Admin or Citizen if pending)
 */
async function updateIssue(req, res) {
  try {
    const { id } = req.params;
    const { title, description, category_id, department_id, ward_id, priority, address } = req.body;

    const [existing] = await pool.query(`SELECT * FROM issues WHERE id = ?`, [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const current = existing[0];

    // Citizen can only update if still pending
    if (req.user.role === 'citizen') {
      if (current.citizen_id !== req.user.id || current.status !== 'pending') {
        return res.status(403).json({ success: false, message: 'You cannot edit this complaint once it is under processing.' });
      }
    }

    let query = `UPDATE issues SET title = ?, description = ?, address = ?`;
    const params = [
      title || current.title,
      description || current.description,
      address !== undefined ? address : current.address
    ];

    if (req.user.role === 'admin') {
      query += `, category_id = ?, department_id = ?, ward_id = ?, priority = ?`;
      params.push(
        category_id || current.category_id,
        department_id !== undefined ? department_id : current.department_id,
        ward_id !== undefined ? ward_id : current.ward_id,
        priority || current.priority
      );
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.query(query, params);

    await logAudit({
      userId: req.user.id,
      action: 'ISSUE_UPDATED',
      entityType: 'issue',
      entityId: id,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Issue details updated successfully.' });
  } catch (error) {
    console.error('[IssueController.updateIssue] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update issue.' });
  }
}

/**
 * Delete issue (Admin only)
 */
async function deleteIssue(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(`SELECT * FROM issues WHERE id = ?`, [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    await pool.query(`DELETE FROM issues WHERE id = ?`, [id]);

    await logAudit({
      userId: req.user.id,
      action: 'ISSUE_DELETED',
      entityType: 'issue',
      entityId: id,
      details: { ticket_id: existing[0].ticket_id },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Civic complaint deleted successfully.' });
  } catch (error) {
    console.error('[IssueController.deleteIssue] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete issue.' });
  }
}

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue
};
