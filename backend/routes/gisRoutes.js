const express = require('express');
const gisController = require('../controllers/gisController');

const router = express.Router();

// GIS markers FeatureCollection
router.get('/issues', gisController.getGisIssues);

// Heatmap points
router.get('/heatmap', gisController.getHeatmapData);

module.exports = router;
