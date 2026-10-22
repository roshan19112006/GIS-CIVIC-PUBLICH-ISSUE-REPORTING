const pool = require('../config/db');

/**
 * Escape CSV field according to RFC 4180
 */
function escapeCsv(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  return `"${str.replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ')}"`;
}

/**
 * Export issues to CSV
 */
async function exportIssuesCsv(req, res) {
  try {
    const { status, category_id, ward_id, department_id, start_date, end_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }
    if (category_id) {
      whereClause += ' AND i.category_id = ?';
      params.push(category_id);
    }
    if (ward_id) {
      whereClause += ' AND i.ward_id = ?';
      params.push(ward_id);
    }
    if (department_id) {
      whereClause += ' AND i.department_id = ?';
      params.push(department_id);
    }
    if (start_date) {
      whereClause += ' AND i.created_at >= ?';
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      whereClause += ' AND i.created_at <= ?';
      params.push(`${end_date} 23:59:59`);
    }

    const query = `
      SELECT i.ticket_id, i.title, i.description, i.latitude, i.longitude, i.address,
             i.priority, i.status, i.deadline, i.created_at, i.updated_at,
             c.name AS category_name,
             d.name AS department_name,
             w.ward_number, w.ward_name,
             cit.name AS citizen_name, cit.email AS citizen_email, cit.phone AS citizen_phone,
             off.name AS assigned_officer, off.badge_number AS officer_badge,
             r.resolution_notes, r.resolved_at,
             f.rating AS citizen_rating, f.is_satisfied
      FROM issues i
      LEFT JOIN issue_categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN wards w ON i.ward_id = w.id
      LEFT JOIN users cit ON i.citizen_id = cit.id
      LEFT JOIN work_orders wo ON (i.id = wo.issue_id AND wo.id = (SELECT MAX(id) FROM work_orders WHERE issue_id = i.id))
      LEFT JOIN users off ON wo.officer_id = off.id
      LEFT JOIN resolutions r ON i.id = r.issue_id
      LEFT JOIN feedback f ON i.id = f.issue_id
      ${whereClause}
      ORDER BY i.created_at DESC
    `;

    const [rows] = await pool.query(query, params);

    const headers = [
      'Ticket ID',
      'Title',
      'Category',
      'Department',
      'Ward Number',
      'Ward Name',
      'Priority',
      'Status',
      'Latitude',
      'Longitude',
      'Address',
      'Citizen Name',
      'Citizen Email',
      'Citizen Phone',
      'Assigned Officer',
      'Officer Badge',
      'Created At',
      'Deadline',
      'Resolved At',
      'Resolution Notes',
      'Citizen Rating (1-5)',
      'Satisfied'
    ];

    let csvContent = headers.map(escapeCsv).join(',') + '\r\n';

    rows.forEach(r => {
      const line = [
        r.ticket_id,
        r.title,
        r.category_name,
        r.department_name || 'Unassigned',
        r.ward_number || 'N/A',
        r.ward_name || 'N/A',
        r.priority,
        r.status,
        r.latitude,
        r.longitude,
        r.address || '',
        r.citizen_name,
        r.citizen_email,
        r.citizen_phone || '',
        r.assigned_officer || 'None',
        r.officer_badge || '',
        r.created_at ? new Date(r.created_at).toISOString() : '',
        r.deadline ? new Date(r.deadline).toISOString() : '',
        r.resolved_at ? new Date(r.resolved_at).toISOString() : '',
        r.resolution_notes || '',
        r.citizen_rating !== null ? r.citizen_rating : '',
        r.is_satisfied !== null ? (r.is_satisfied ? 'Yes' : 'No') : ''
      ];
      csvContent += line.map(escapeCsv).join(',') + '\r\n';
    });

    const filename = `civic-complaints-report-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('[ReportController.exportIssuesCsv] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate CSV report.' });
  }
}

/**
 * Get system audit logs (Admin only)
 */
async function getAuditLogs(req, res) {
  try {
    const { action, entity_type, limit = 50, page = 1 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (action) {
      whereClause += ' AND a.action = ?';
      params.push(action);
    }
    if (entity_type) {
      whereClause += ' AND a.entity_type = ?';
      params.push(entity_type);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM audit_logs a ${whereClause}`, params);
    const total = countRows[0].total;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const queryParams = [...params, parseInt(limit, 10), offset];

    const [rows] = await pool.query(
      `SELECT a.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      queryParams
    );

    return res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: rows
    });
  } catch (error) {
    console.error('[ReportController.getAuditLogs] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
}

/**
 * Get notifications for current user
 */
async function getNotifications(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [req.user.id]
    );

    const [unreadCount] = await pool.query(
      `SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [req.user.id]
    );

    return res.json({
      success: true,
      unreadCount: unreadCount[0]?.unread || 0,
      data: rows
    });
  } catch (error) {
    console.error('[ReportController.getNotifications] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

/**
 * Mark a notification as read
 */
async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('[ReportController.markNotificationRead] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

/**
 * Mark all notifications as read for current user
 */
async function markAllNotificationsRead(req, res) {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ?`,
      [req.user.id]
    );
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('[ReportController.markAllNotificationsRead] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications read.' });
  }
}

module.exports = {
  exportIssuesCsv,
  getAuditLogs,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
