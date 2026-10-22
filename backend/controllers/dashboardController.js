const pool = require('../config/db');

/**
 * Get aggregated dashboard statistics based on real database records
 */
async function getStats(req, res) {
  try {
    // Role contextualization:
    // If officer, stats can be filtered for their work orders
    const isOfficer = req.user && req.user.role === 'officer';
    const officerId = isOfficer ? req.user.id : null;

    let issueFilter = '';
    const filterParams = [];
    if (isOfficer) {
      issueFilter = ' WHERE i.id IN (SELECT issue_id FROM work_orders WHERE officer_id = ?)';
      filterParams.push(officerId);
    }

    // 1. Status counts
    const [statusRows] = await pool.query(
      `SELECT i.status, COUNT(i.id) AS count
       FROM issues i
       ${issueFilter}
       GROUP BY i.status`,
      filterParams
    );

    const counts = {
      total: 0,
      pending: 0,
      assigned: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      reopened: 0
    };

    statusRows.forEach(r => {
      if (counts[r.status] !== undefined) {
        counts[r.status] = parseInt(r.count, 10);
      }
      counts.total += parseInt(r.count, 10);
    });

    // 2. Overdue / SLA compliance
    const [overdueRows] = await pool.query(
      `SELECT COUNT(i.id) AS overdue_count
       FROM issues i
       ${issueFilter ? issueFilter + ' AND' : 'WHERE'} 
       i.deadline IS NOT NULL AND i.deadline < NOW() AND i.status NOT IN ('resolved', 'closed')`,
      filterParams
    );
    const overdueCount = overdueRows[0]?.overdue_count || 0;

    // SLA compliance %
    const resolvedOrClosed = counts.resolved + counts.closed;
    const slaRate = counts.total > 0 ? Math.round(((counts.total - overdueCount) / counts.total) * 100) : 100;

    // 3. User counts (for admin)
    const [userCounts] = await pool.query(
      `SELECT role, COUNT(id) AS count FROM users WHERE is_active = TRUE GROUP BY role`
    );
    let totalCitizens = 0;
    let totalOfficers = 0;
    userCounts.forEach(u => {
      if (u.role === 'citizen') totalCitizens = parseInt(u.count, 10);
      if (u.role === 'officer') totalOfficers = parseInt(u.count, 10);
    });

    // 4. Average Citizen Satisfaction Rating
    const [ratingRows] = await pool.query(
      `SELECT AVG(rating) AS avg_rating, COUNT(id) AS total_feedback FROM feedback`
    );
    const avgRating = ratingRows[0]?.avg_rating ? parseFloat(Number(ratingRows[0].avg_rating).toFixed(1)) : 0;
    const totalFeedback = ratingRows[0]?.total_feedback || 0;

    return res.json({
      success: true,
      data: {
        total: counts.total,
        pending: counts.pending,
        assigned: counts.assigned,
        in_progress: counts.in_progress,
        resolved: counts.resolved,
        closed: counts.closed,
        reopened: counts.reopened,
        overdue: overdueCount,
        slaComplianceRate: Math.max(0, Math.min(100, slaRate)),
        totalCitizens,
        totalOfficers,
        avgRating,
        totalFeedback
      }
    });
  } catch (error) {
    console.error('[DashboardController.getStats] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics.' });
  }
}

/**
 * Get comprehensive analytics charts data
 */
async function getAnalytics(req, res) {
  try {
    // 1. By Category
    const [byCategory] = await pool.query(`
      SELECT c.name, c.color_code, COUNT(i.id) AS count
      FROM issue_categories c
      LEFT JOIN issues i ON c.id = i.category_id
      GROUP BY c.id, c.name, c.color_code
      ORDER BY count DESC
    `);

    // 2. By Status
    const [byStatus] = await pool.query(`
      SELECT status, COUNT(id) AS count
      FROM issues
      GROUP BY status
    `);

    // 3. By Ward
    const [byWard] = await pool.query(`
      SELECT w.ward_number, w.ward_name, COUNT(i.id) AS count
      FROM wards w
      LEFT JOIN issues i ON w.id = i.ward_id
      GROUP BY w.id, w.ward_number, w.ward_name
      ORDER BY count DESC
    `);

    // 4. By Priority
    const [byPriority] = await pool.query(`
      SELECT priority, COUNT(id) AS count
      FROM issues
      GROUP BY priority
    `);

    // 5. Officer Performance
    const [officerPerformance] = await pool.query(`
      SELECT u.id, u.name, u.badge_number, d.name AS department_name,
             COUNT(wo.id) AS total_assigned,
             SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) AS total_completed,
             ROUND(AVG(f.rating), 1) AS avg_rating
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN work_orders wo ON u.id = wo.officer_id
      LEFT JOIN feedback f ON wo.issue_id = f.issue_id
      WHERE u.role = 'officer' AND u.is_active = TRUE
      GROUP BY u.id, u.name, u.badge_number, d.name
      ORDER BY total_completed DESC
    `);

    // 6. Recent Monthly Trends (Last 6 months)
    const [monthlyTrends] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%b %Y') AS month_label,
             DATE_FORMAT(created_at, '%Y-%m') AS month_key,
             COUNT(id) AS reported,
             SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS resolved
      FROM issues
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month_label, month_key
      ORDER BY month_key ASC
    `);

    return res.json({
      success: true,
      data: {
        byCategory,
        byStatus,
        byWard,
        byPriority,
        officerPerformance,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('[DashboardController.getAnalytics] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve analytics data.' });
  }
}

module.exports = { getStats, getAnalytics };
