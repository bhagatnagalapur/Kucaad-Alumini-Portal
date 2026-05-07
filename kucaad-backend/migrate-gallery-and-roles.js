require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const statements = [
    "ALTER TABLE Users MODIFY COLUMN role ENUM('Student', 'Professor', 'Executive Member', 'Admin') DEFAULT 'Student'",
    `CREATE TABLE IF NOT EXISTS GalleryItems (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_data LONGTEXT NOT NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE
    )`,
];

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }

    const runNext = (index) => {
        if (index >= statements.length) {
            console.log('Gallery and role migration completed successfully.');
            process.exit(0);
            return;
        }

        db.query(statements[index], (queryError) => {
            if (queryError) {
                console.error('Migration failed:', queryError);
                process.exit(1);
                return;
            }

            runNext(index + 1);
        });
    };

    runNext(0);
});
