require('dotenv').config();
const db = require('./config/db');

const addColumnIfMissing = (tableName, colName, colDef) =>
  new Promise((resolve, reject) => {
    const check = `
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `;
    db.query(check, [tableName, colName], (err, rows) => {
      if (err) return reject(err);
      if (rows[0].cnt > 0) {
        console.log(`  ↳ column '${colName}' already exists — skipping`);
        return resolve();
      }
      db.query(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colDef}`, (e2) => {
        if (e2) return reject(e2);
        console.log(`  ✓ added column '${colName}' to ${tableName}`);
        resolve();
      });
    });
  });

const runQuery = (sql) =>
  new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) return reject(err);
      console.log('  ✓', sql.trim().slice(0, 70));
      resolve();
    });
  });

const migrate = async () => {
  console.log('Running Events migration...');

  await addColumnIfMissing('Events', 'location', "VARCHAR(255) NULL AFTER date");
  await addColumnIfMissing('Events', 'rsvp_count', "INT NOT NULL DEFAULT 0 AFTER location");

  await runQuery(`
    CREATE TABLE IF NOT EXISTS EventRSVPs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_rsvp (event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )
  `);

  console.log('\nEvents migration complete ✓');
  process.exit(0);
};

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
