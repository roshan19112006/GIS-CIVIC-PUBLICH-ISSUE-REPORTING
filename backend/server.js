const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const issueRoutes = require('./routes/issueRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const gisRoutes = require('./routes/gisRoutes');
const reportRoutes = require('./routes/reportRoutes');
const reportController = require('./controllers/reportController');
const { authenticateToken, authorize } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Rate Limiter (Allow generous limit in dev, protect against brute-force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // limit login/register attempts
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded issue photographs statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/issues', workflowRoutes); // Workflow endpoints like /api/issues/:id/assign, /status, /resolution, /feedback
app.use('/api/issues', issueRoutes);    // Core CRUD like /api/issues, /api/issues/:id
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gis', gisRoutes);
app.use('/api/reports', reportRoutes);

// Audit logs endpoint
app.get('/api/audit-logs', authenticateToken, authorize(['admin']), reportController.getAuditLogs);

// Notifications endpoints
app.get('/api/notifications', authenticateToken, reportController.getNotifications);
app.put('/api/notifications/read-all', authenticateToken, reportController.markAllNotificationsRead);
app.put('/api/notifications/:id/read', authenticateToken, reportController.markNotificationRead);

// System health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'GIS Civic Issue Reporting Platform API',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.message || err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File is too large. Maximum size allowed is 5MB.' });
    }
    return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[Civic GIS API] Server running on port ${PORT}`);
  console.log(`[Civic GIS API] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Civic GIS API] Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

module.exports = app;
