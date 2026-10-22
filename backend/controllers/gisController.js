const pool = require('../config/db');

/**
 * Get GIS GeoJSON and marker feature collection for interactive map
 */
async function getGisIssues(req, res) {
  try {
    const { status, category_id, priority, ward_id, department_id } = req.query;

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
    if (priority) {
      whereClause += ' AND i.priority = ?';
      params.push(priority);
    }
    if (ward_id) {
      whereClause += ' AND i.ward_id = ?';
      params.push(ward_id);
    }
    if (department_id) {
      whereClause += ' AND i.department_id = ?';
      params.push(department_id);
    }

    const query = `
      SELECT i.id, i.ticket_id, i.title, i.description, i.latitude, i.longitude, i.address,
             i.priority, i.status, i.deadline, i.created_at,
             c.name AS category_name, c.color_code AS category_color, c.icon AS category_icon,
             d.name AS department_name,
             w.ward_number, w.ward_name,
             (SELECT image_url FROM issue_images WHERE issue_id = i.id AND image_type = 'complaint' LIMIT 1) AS thumbnail_url
      FROM issues i
      LEFT JOIN issue_categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN wards w ON i.ward_id = w.id
      ${whereClause}
      ORDER BY i.created_at DESC
    `;

    const [rows] = await pool.query(query, params);

    // Convert into GeoJSON FeatureCollection
    const features = rows.map(issue => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(issue.longitude), parseFloat(issue.latitude)] // GeoJSON is [lon, lat]
      },
      properties: {
        id: issue.id,
        ticket_id: issue.ticket_id,
        title: issue.title,
        description: issue.description,
        address: issue.address,
        priority: issue.priority,
        status: issue.status,
        deadline: issue.deadline,
        created_at: issue.created_at,
        category_name: issue.category_name,
        category_color: issue.category_color,
        category_icon: issue.category_icon,
        department_name: issue.department_name,
        ward_number: issue.ward_number,
        ward_name: issue.ward_name,
        thumbnail_url: issue.thumbnail_url
      }
    }));

    return res.json({
      success: true,
      count: features.length,
      geoJson: {
        type: 'FeatureCollection',
        features
      },
      data: rows
    });
  } catch (error) {
    console.error('[GisController.getGisIssues] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve GIS complaint markers.' });
  }
}

/**
 * Get Heatmap data points [lat, lng, intensity]
 */
async function getHeatmapData(req, res) {
  try {
    const { category_id, status } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category_id) {
      whereClause += ' AND category_id = ?';
      params.push(category_id);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT latitude, longitude, priority, status FROM issues ${whereClause}`,
      params
    );

    // Compute intensity based on priority & status
    const points = rows.map(r => {
      let weight = 0.5;
      if (r.priority === 'urgent') weight = 1.0;
      else if (r.priority === 'high') weight = 0.8;
      else if (r.priority === 'medium') weight = 0.5;
      else if (r.priority === 'low') weight = 0.3;

      if (r.status === 'pending') weight += 0.2;

      return [
        parseFloat(r.latitude),
        parseFloat(r.longitude),
        Math.min(1.0, weight)
      ];
    });

    return res.json({
      success: true,
      count: points.length,
      data: points
    });
  } catch (error) {
    console.error('[GisController.getHeatmapData] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve heatmap points.' });
  }
}

module.exports = { getGisIssues, getHeatmapData };
