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
    console.log('Connected to MySQL.');

    const query = `
        CREATE TABLE IF NOT EXISTS OTP_Verifications (
            email VARCHAR(255) PRIMARY KEY,
            otp_code VARCHAR(10) NOT NULL,
            expires_at DATETIME NOT NULL,
            verified BOOLEAN DEFAULT FALSE
        );
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('OTP_Verifications table created successfully!');
        }
        process.exit(0);
    });
});
