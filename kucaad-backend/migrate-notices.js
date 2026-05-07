require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }

    const createNotices = `
        CREATE TABLE IF NOT EXISTS Notices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            priority ENUM('Low', 'Normal', 'High') DEFAULT 'Normal',
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NULL,
            FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
        )
    `;

    const createNotifications = `
        CREATE TABLE IF NOT EXISTS Notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            notice_id INT,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            read_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (notice_id) REFERENCES Notices(id) ON DELETE CASCADE
        )
    `;

    const createIndex = `CREATE INDEX idx_notifications_user_read ON Notifications(user_id, read_at)`;

    db.query(createNotices, (noticeErr) => {
        if (noticeErr) {
            console.error('Failed to create Notices table:', noticeErr);
            process.exit(1);
        }

        db.query(createNotifications, (notificationErr) => {
            if (notificationErr) {
                console.error('Failed to create Notifications table:', notificationErr);
                process.exit(1);
            }

            db.query(createIndex, () => {
                console.log('Notices and notifications migration completed successfully.');
                process.exit(0);
            });
        });
    });
});
