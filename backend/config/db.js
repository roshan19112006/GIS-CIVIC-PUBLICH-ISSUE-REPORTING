const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'gis_civic_platform',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4'
});

// Test connection on load
pool.getConnection()
  .then((conn) => {
    console.log(`[Database] Connected successfully to MySQL database "${process.env.DB_NAME || 'gis_civic_platform'}" on ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
    conn.release();
  })
  .catch((err) => {
    console.error('[Database] MySQL connection error:', err.message);
  });

module.exports = pool;
