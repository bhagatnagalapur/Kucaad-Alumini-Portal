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

    const createTable = `
        CREATE TABLE IF NOT EXISTS ExecutiveCommitteeMembers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(255) NOT NULL,
            bio TEXT,
            photo_url VARCHAR(255),
            order_index INT DEFAULT 0,
            updated_by INT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (updated_by) REFERENCES Users(id) ON DELETE SET NULL
        )
    `;

    db.query(createTable, (tableErr) => {
        if (tableErr) {
            console.error('Failed to create ExecutiveCommitteeMembers table:', tableErr);
            process.exit(1);
        }

        console.log('ExecutiveCommitteeMembers migration completed successfully.');
        process.exit(0);
    });
});
