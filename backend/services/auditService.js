const pool = require('../config/db');

/**
 * Log an administrative, workflow, or security action
 * @param {Object} params
 * @param {number|null} params.userId
 * @param {string} params.action - e.g. 'ISSUE_CREATED', 'STATUS_UPDATED', 'WORK_ORDER_ASSIGNED'
 * @param {string} params.entityType - e.g. 'issue', 'user', 'work_order'
 * @param {number|null} params.entityId
 * @param {Object|null} params.details - JSON serializable object
 * @param {string} [params.ipAddress]
 */
async function logAudit({ userId = null, action, entityType, entityId = null, details = null, ipAddress = '127.0.0.1' }) {
  try {
    const detailsJson = details ? JSON.stringify(details) : null;
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, detailsJson, ipAddress]
    );
  } catch (error) {
    console.error('[AuditService] Failed to log audit event:', error.message);
  }
}

module.exports = { logAudit };
