const pool = require('../config/db');

/**
 * Send an in-app notification to a user
 * @param {Object} params
 * @param {number} params.userId
 * @param {number|null} params.issueId
 * @param {string} params.title
 * @param {string} params.message
 * @param {'info'|'status_update'|'assignment'|'resolution'|'warning'} [params.type]
 */
async function createNotification({ userId, issueId = null, title, message, type = 'info' }) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, issue_id, title, message, type, is_read) 
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [userId, issueId, title, message, type]
    );
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error.message);
  }
}

/**
 * Notify all active admins
 * @param {Object} params
 * @param {number|null} params.issueId
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.type]
 */
async function notifyAdmins({ issueId = null, title, message, type = 'info' }) {
  try {
    const [admins] = await pool.query(`SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE`);
    for (const admin of admins) {
      await createNotification({ userId: admin.id, issueId, title, message, type });
    }
  } catch (error) {
    console.error('[NotificationService] Failed to notify admins:', error.message);
  }
}

module.exports = { createNotification, notifyAdmins };
