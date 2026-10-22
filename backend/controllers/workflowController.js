const pool = require('../config/db');
const { logAudit } = require('../services/auditService');
const { createNotification, notifyAdmins } = require('../services/notificationService');

/**
 * 1. Assign complaint to Department and Field Officer (Admin only)
 */
async function assignIssue(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { officer_id, department_id, priority, deadline, instructions } = req.body;

    if (!officer_id || !department_id) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Officer ID and Department ID are required.' });
    }

    // Verify issue exists
    const [issues] = await connection.query(`SELECT * FROM issues WHERE id = ?`, [id]);
    if (!issues.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }
    const issue = issues[0];

    // Verify officer exists and is an active officer
    const [officers] = await connection.query(
      `SELECT * FROM users WHERE id = ? AND role = 'officer' AND is_active = TRUE`,
      [officer_id]
    );
    if (!officers.length) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Selected officer does not exist or is inactive.' });
    }
    const officer = officers[0];

    const prevStatus = issue.status;
    const newStatus = 'assigned';

    // 1. Create or update work order
    const [woResult] = await connection.query(
      `INSERT INTO work_orders (issue_id, officer_id, assigned_by, department_id, status, instructions, assigned_at)
       VALUES (?, ?, ?, ?, 'assigned', ?, NOW())`,
      [id, officer_id, req.user.id, department_id, instructions || 'Please inspect and resolve this civic complaint.']
    );
    const workOrderId = woResult.insertId;

    // 2. Update issue
    let deadlineDate = deadline ? new Date(deadline) : issue.deadline;
    if (!deadlineDate) {
      deadlineDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    }

    await connection.query(
      `UPDATE issues 
       SET department_id = ?, priority = ?, status = ?, deadline = ?, updated_at = NOW()
       WHERE id = ?`,
      [department_id, priority || issue.priority, newStatus, deadlineDate, id]
    );

    // 3. Status history entry
    await connection.query(
      `INSERT INTO issue_status_history (issue_id, changed_by, previous_status, new_status, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.user.id, prevStatus, newStatus, `Assigned to ${officer.name} (${officer.badge_number || 'Field Officer'}). Work Order #${workOrderId}.`]
    );

    await connection.commit();

    // 4. Notifications
    await createNotification({
      userId: officer_id,
      issueId: id,
      title: 'New Work Order Assigned',
      message: `You have been assigned complaint #${issue.ticket_id} ("${issue.title}"). Priority: ${priority || issue.priority}.`,
      type: 'assignment'
    });

    await createNotification({
      userId: issue.citizen_id,
      issueId: id,
      title: 'Complaint Assigned to Field Officer',
      message: `Your complaint #${issue.ticket_id} has been assigned to Officer ${officer.name}.`,
      type: 'status_update'
    });

    await logAudit({
      userId: req.user.id,
      action: 'WORK_ORDER_ASSIGNED',
      entityType: 'work_order',
      entityId: workOrderId,
      details: { issue_id: id, ticket_id: issue.ticket_id, officer_id, officer_name: officer.name },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Complaint assigned to ${officer.name} successfully.`,
      workOrderId
    });
  } catch (error) {
    await connection.rollback();
    console.error('[WorkflowController.assignIssue] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign complaint.' });
  } finally {
    connection.release();
  }
}

/**
 * 2. Update complaint / work order status (Officer or Admin)
 */
async function updateStatus(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status, remarks } = req.body;

    const allowedStatuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened'];
    if (!allowedStatuses.includes(status)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const [issues] = await connection.query(`SELECT * FROM issues WHERE id = ?`, [id]);
    if (!issues.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }
    const issue = issues[0];

    // If officer, verify authorization on active work order
    if (req.user.role === 'officer') {
      const [wo] = await connection.query(
        `SELECT * FROM work_orders WHERE issue_id = ? AND officer_id = ? ORDER BY id DESC LIMIT 1`,
        [id, req.user.id]
      );
      if (!wo.length) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'You are not assigned to this work order.' });
      }

      // Update work order status accordingly
      const woStatus = status === 'in_progress' ? 'in_progress' : (status === 'resolved' ? 'completed' : wo[0].status);
      const acceptedAt = (status === 'in_progress' && !wo[0].accepted_at) ? new Date() : wo[0].accepted_at;

      await connection.query(
        `UPDATE work_orders SET status = ?, accepted_at = COALESCE(accepted_at, ?) WHERE id = ?`,
        [woStatus, acceptedAt, wo[0].id]
      );
    }

    const prevStatus = issue.status;

    // Update issue status
    await connection.query(
      `UPDATE issues SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );

    // Record status history
    await connection.query(
      `INSERT INTO issue_status_history (issue_id, changed_by, previous_status, new_status, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.user.id, prevStatus, status, remarks || `Status changed from ${prevStatus} to ${status}`]
    );

    await connection.commit();

    // Notify citizen
    await createNotification({
      userId: issue.citizen_id,
      issueId: id,
      title: `Complaint Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your complaint #${issue.ticket_id} status is now "${status.replace('_', ' ')}". Remarks: ${remarks || 'None'}`,
      type: 'status_update'
    });

    await logAudit({
      userId: req.user.id,
      action: 'STATUS_UPDATED',
      entityType: 'issue',
      entityId: id,
      details: { previous: prevStatus, next: status, ticket_id: issue.ticket_id },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Status updated to ${status}.`
    });
  } catch (error) {
    await connection.rollback();
    console.error('[WorkflowController.updateStatus] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  } finally {
    connection.release();
  }
}

/**
 * 3. Resolve complaint with mandatory completion photograph & notes (Officer or Admin)
 */
async function resolveIssue(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { resolution_notes } = req.body;

    if (!resolution_notes || resolution_notes.trim().length < 10) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Detailed resolution notes (at least 10 characters) are required.'
      });
    }

    // Require completion photo upload
    if (!req.file) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Resolution completion photograph is required as physical proof of work.'
      });
    }

    const [issues] = await connection.query(`SELECT * FROM issues WHERE id = ?`, [id]);
    if (!issues.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }
    const issue = issues[0];

    // Find active work order
    const [workOrders] = await connection.query(
      `SELECT * FROM work_orders WHERE issue_id = ? ORDER BY id DESC LIMIT 1`,
      [id]
    );
    const workOrder = workOrders[0] || null;

    if (req.user.role === 'officer' && (!workOrder || workOrder.officer_id !== req.user.id)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'You are not authorized to resolve this work order.' });
    }

    const completionPhotoUrl = `/uploads/${req.file.filename}`;

    // 1. Insert completion photo into issue_images
    await connection.query(
      `INSERT INTO issue_images (issue_id, image_url, image_type, uploaded_by, caption, file_size)
       VALUES (?, ?, 'resolution', ?, ?, ?)`,
      [id, completionPhotoUrl, req.user.id, 'Work order completion photograph', req.file.size]
    );

    // 2. Upsert resolution record
    await connection.query(
      `INSERT INTO resolutions (issue_id, work_order_id, resolved_by, resolution_notes, completion_photo_url, resolved_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         resolution_notes = VALUES(resolution_notes),
         completion_photo_url = VALUES(completion_photo_url),
         resolved_at = NOW()`,
      [id, workOrder ? workOrder.id : null, req.user.id, resolution_notes.trim(), completionPhotoUrl]
    );

    // 3. Mark work order completed
    if (workOrder) {
      await connection.query(
        `UPDATE work_orders SET status = 'completed', completed_at = NOW() WHERE id = ?`,
        [workOrder.id]
      );
    }

    // 4. Update issue status to resolved
    const prevStatus = issue.status;
    await connection.query(
      `UPDATE issues SET status = 'resolved', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    // 5. Add status history entry
    await connection.query(
      `INSERT INTO issue_status_history (issue_id, changed_by, previous_status, new_status, remarks)
       VALUES (?, ?, ?, 'resolved', ?)`,
      [id, req.user.id, prevStatus, `Complaint resolved with completion photo: "${resolution_notes.trim().slice(0, 100)}..."`]
    );

    await connection.commit();

    // 6. Notify citizen with prompt to submit feedback
    await createNotification({
      userId: issue.citizen_id,
      issueId: id,
      title: 'Complaint Resolved — Please Verify & Rate',
      message: `Your complaint #${issue.ticket_id} has been marked resolved by the field officer. Please inspect the completion photo and submit your rating.`,
      type: 'resolution'
    });

    await logAudit({
      userId: req.user.id,
      action: 'ISSUE_RESOLVED',
      entityType: 'issue',
      entityId: id,
      details: { ticket_id: issue.ticket_id, notes: resolution_notes },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Complaint resolved and completion photograph recorded successfully.',
      completionPhotoUrl
    });
  } catch (error) {
    await connection.rollback();
    console.error('[WorkflowController.resolveIssue] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record resolution.' });
  } finally {
    connection.release();
  }
}

/**
 * 4. Refer complaint to another department with reason (Officer only)
 */
async function referIssue(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { target_department_id, reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'A valid referral reason is required.' });
    }

    const [issues] = await connection.query(`SELECT * FROM issues WHERE id = ?`, [id]);
    if (!issues.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }
    const issue = issues[0];

    // Check officer assignment
    const [wo] = await connection.query(
      `SELECT * FROM work_orders WHERE issue_id = ? AND officer_id = ? ORDER BY id DESC LIMIT 1`,
      [id, req.user.id]
    );

    if (req.user.role === 'officer' && !wo.length) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'You are not assigned to this work order.' });
    }

    // Mark current work order as referred
    if (wo.length) {
      await connection.query(
        `UPDATE work_orders SET status = 'referred' WHERE id = ?`,
        [wo[0].id]
      );
    }

    // Update issue: reset status to pending or update department if target specified
    await connection.query(
      `UPDATE issues 
       SET status = 'pending', department_id = COALESCE(?, department_id), updated_at = NOW() 
       WHERE id = ?`,
      [target_department_id || null, id]
    );

    // Status history
    await connection.query(
      `INSERT INTO issue_status_history (issue_id, changed_by, previous_status, new_status, remarks)
       VALUES (?, ?, ?, 'pending', ?)`,
      [id, req.user.id, issue.status, `Referred by officer ${req.user.name}. Reason: ${reason}`]
    );

    await connection.commit();

    // Notify admins
    await notifyAdmins({
      issueId: id,
      title: 'Complaint Referred for Reassignment',
      message: `Complaint #${issue.ticket_id} was referred by Officer ${req.user.name}. Reason: ${reason}`,
      type: 'warning'
    });

    await logAudit({
      userId: req.user.id,
      action: 'ISSUE_REFERRED',
      entityType: 'issue',
      entityId: id,
      details: { ticket_id: issue.ticket_id, reason, target_department_id },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Complaint successfully referred to municipal administration for reassignment.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('[WorkflowController.referIssue] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to refer complaint.' });
  } finally {
    connection.release();
  }
}

/**
 * 5. Citizen confirms resolution, rates, and gives feedback / reopen
 */
async function submitFeedback(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { rating, comments, is_satisfied, reopen_requested, reopen_reason } = req.body;

    const [issues] = await connection.query(`SELECT * FROM issues WHERE id = ?`, [id]);
    if (!issues.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }
    const issue = issues[0];

    // Permission check: only the complainant citizen can submit feedback
    if (req.user.role === 'citizen' && issue.citizen_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Only the citizen who reported this issue can submit feedback.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'A star rating between 1 and 5 is required.' });
    }

    const satisfied = is_satisfied !== undefined ? (is_satisfied ? 1 : 0) : (rating >= 3 ? 1 : 0);
    const reopen = Boolean(reopen_requested && (rating <= 2 || !satisfied));

    // Save feedback
    await connection.query(
      `INSERT INTO feedback (issue_id, citizen_id, is_satisfied, rating, comments, reopen_requested, reopen_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_satisfied = VALUES(is_satisfied),
         rating = VALUES(rating),
         comments = VALUES(comments),
         reopen_requested = VALUES(reopen_requested),
         reopen_reason = VALUES(reopen_reason)`,
      [id, req.user.id, satisfied, rating, comments || null, reopen ? 1 : 0, reopen ? reopen_reason : null]
    );

    // If citizen requested reopening due to unsatisfactory resolution
    if (reopen) {
      const prevStatus = issue.status;
      await connection.query(
        `UPDATE issues SET status = 'reopened', updated_at = NOW() WHERE id = ?`,
        [id]
      );

      await connection.query(
        `INSERT INTO issue_status_history (issue_id, changed_by, previous_status, new_status, remarks)
         VALUES (?, ?, ?, 'reopened', ?)`,
        [id, req.user.id, prevStatus, `Reopened by citizen (${rating} stars): ${reopen_reason || comments || 'Unsatisfactory resolution.'}`]
      );

      await notifyAdmins({
        issueId: id,
        title: 'Complaint Reopened by Citizen',
        message: `Complaint #${issue.ticket_id} was reopened by citizen with rating ${rating}/5. Reason: ${reopen_reason || comments || 'Resolution unsatisfactory'}`,
        type: 'warning'
      });
    } else {
      // If citizen is satisfied, mark as closed
      await connection.query(
        `UPDATE issues SET status = 'closed', updated_at = NOW() WHERE id = ?`,
        [id]
      );

      await connection.query(
        `INSERT INTO issue_status_history (issue_id, changed_by, previous_status, new_status, remarks)
         VALUES (?, ?, 'resolved', 'closed', ?)`,
        [id, req.user.id, `Citizen confirmed satisfaction (${rating}/5 stars). Ticket closed.`]
      );
    }

    await connection.commit();

    await logAudit({
      userId: req.user.id,
      action: reopen ? 'ISSUE_REOPENED' : 'FEEDBACK_SUBMITTED',
      entityType: 'feedback',
      entityId: id,
      details: { rating, satisfied, reopen },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: reopen
        ? 'Your complaint has been reopened and escalated to municipal administration for review.'
        : 'Thank you for your feedback! Your complaint is now closed.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('[WorkflowController.submitFeedback] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  } finally {
    connection.release();
  }
}

/**
 * 6. Get timeline history for an issue
 */
async function getHistory(req, res) {
  try {
    const { id } = req.params;

    const [history] = await pool.query(
      `SELECT sh.*, u.name AS user_name, u.role AS user_role
       FROM issue_status_history sh
       LEFT JOIN users u ON sh.changed_by = u.id
       WHERE sh.issue_id = ?
       ORDER BY sh.created_at ASC`,
      [id]
    );

    return res.json({ success: true, data: history });
  } catch (error) {
    console.error('[WorkflowController.getHistory] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
}

module.exports = {
  assignIssue,
  updateStatus,
  resolveIssue,
  referIssue,
  submitFeedback,
  getHistory
};
