require('dotenv').config();
const db = require('./config/db');

const tables = [
  `CREATE TABLE IF NOT EXISTS Profiles (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(255),
    course VARCHAR(100),
    graduation_year INT,
    batch_type ENUM('year','range') DEFAULT 'year',
    batch_year INT,
    batch_start_year INT,
    batch_end_year INT,
    batch_label VARCHAR(32),
    current_job VARCHAR(255),
    company VARCHAR(255),
    linkedin_url VARCHAR(255),
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS Events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATETIME,
    location VARCHAR(255) NULL,
    rsvp_count INT NOT NULL DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS EventRSVPs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_rsvp (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS Jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    description TEXT,
    posted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS GalleryItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_data LONGTEXT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS ExecutiveCommitteeMembers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    bio TEXT,
    photo_url VARCHAR(255),
    order_index INT DEFAULT 0,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    priority ENUM('Low','Normal','High') DEFAULT 'Normal',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS AboutUsContent (
    id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    mission TEXT NOT NULL,
    vision TEXT NOT NULL,
    what_we_do TEXT NOT NULL,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notice_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
];

const run = (sql) =>
  new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err && err.code !== 'ER_DUP_KEYNAME') return reject(err);
      const label = sql.trim().replace(/\s+/g, ' ').slice(0, 60);
      console.log('  ✓', label);
      resolve();
    });
  });

(async () => {
  console.log('Running full schema setup...\n');
  for (const sql of tables) {
    await run(sql);
  }
  // Add index separately, ignore duplicate
  await run('CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON Notifications(user_id, read_at)').catch(() => {});
  console.log('\n✅ All tables created/verified successfully.');
  process.exit(0);
})().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
