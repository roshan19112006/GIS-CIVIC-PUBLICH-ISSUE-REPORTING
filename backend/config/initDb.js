const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function initDb() {
  console.log('[DB-Init] Starting database schema & seed initialization...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    multipleStatements: true
  });

  try {
    const dbName = process.env.DB_NAME || 'gis_civic_platform';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);

    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('[DB-Init] Applying schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('[DB-Init] Schema applied successfully.');
    }

    const seedPath = path.join(__dirname, '..', '..', 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('[DB-Init] Applying seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('[DB-Init] Seed data inserted successfully.');
    }

    // Ensure sample upload images exist
    require('./createSampleImages');

    console.log('[DB-Init] Database initialization completed successfully.');
  } catch (error) {
    console.error('[DB-Init] Error during database setup:', error.message);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = initDb;
