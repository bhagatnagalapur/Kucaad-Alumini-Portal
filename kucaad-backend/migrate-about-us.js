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
        CREATE TABLE IF NOT EXISTS AboutUsContent (
            id INT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            summary TEXT NOT NULL,
            mission TEXT NOT NULL,
            vision TEXT NOT NULL,
            what_we_do TEXT NOT NULL,
            updated_by INT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (updated_by) REFERENCES Users(id) ON DELETE SET NULL
        )
    `;

    db.query(createTable, (tableErr) => {
        if (tableErr) {
            console.error('Failed to create AboutUsContent table:', tableErr);
            process.exit(1);
        }

        const seed = `
            INSERT INTO AboutUsContent (id, title, summary, mission, vision, what_we_do)
            VALUES (
                1,
                'About Us',
                'KUCAAD connects alumni, faculty, and students through mentorship, opportunities, and shared university pride.',
                'Build a strong, active alumni network that supports careers, collaboration, and lifelong learning.',
                'Create a vibrant community where every KUCAAD member stays connected and contributes back.',
                'Share alumni stories, post opportunities, highlight events, and celebrate the association''s journey.'
            )
            ON DUPLICATE KEY UPDATE id = id
        `;

        db.query(seed, (seedErr) => {
            if (seedErr) {
                console.error('Failed to seed AboutUsContent:', seedErr);
                process.exit(1);
            }

            console.log('About Us migration completed successfully.');
            process.exit(0);
        });
    });
});
