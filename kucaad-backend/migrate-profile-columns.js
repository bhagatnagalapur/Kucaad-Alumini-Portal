require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const columns = [
    "ADD COLUMN IF NOT EXISTS course VARCHAR(100) NULL",
    "ADD COLUMN IF NOT EXISTS batch_type ENUM('year', 'range') DEFAULT 'year'",
    "ADD COLUMN IF NOT EXISTS batch_year INT NULL",
    "ADD COLUMN IF NOT EXISTS batch_start_year INT NULL",
    "ADD COLUMN IF NOT EXISTS batch_end_year INT NULL",
    "ADD COLUMN IF NOT EXISTS batch_label VARCHAR(32) NULL",
];

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }

    const query = `ALTER TABLE Profiles ${columns.join(', ')}`;

    db.query(query, (queryError) => {
        if (queryError) {
            console.error('Failed to migrate Profiles table:', queryError);
            process.exit(1);
        }

        console.log('Profiles table migrated successfully.');
        process.exit(0);
    });
});
