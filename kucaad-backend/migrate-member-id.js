/**
 * Migration: Add member_id column to Users table
 * Run once: node migrate-member-id.js
 */
require('dotenv').config();
const db = require('./config/db');

const migrate = () => {
    console.log('Starting member_id migration...');

    // Step 1: Check if member_id column already exists
    const checkColumnSQL = `
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'member_id'
    `;

    db.query(checkColumnSQL, (err, cols) => {
        if (err) {
            console.error('Error checking column:', err.message);
            process.exit(1);
        }

        const backfillUsers = () => {
            // Step 2: Backfill existing users that don't have a member_id
            const backfillSQL = `SELECT id FROM Users WHERE member_id IS NULL ORDER BY id`;
            db.query(backfillSQL, (err, rows) => {
                if (err) {
                    console.error('Error fetching users:', err.message);
                    process.exit(1);
                }

                if (rows.length === 0) {
                    console.log('✅ All users already have a member_id. Done!');
                    process.exit(0);
                }

                db.query(
                    `SELECT MAX(CAST(SUBSTRING(member_id, 8) AS UNSIGNED)) AS maxNum FROM Users WHERE member_id IS NOT NULL`,
                    (err, maxRows) => {
                        let counter = (maxRows && maxRows[0] && maxRows[0].maxNum) ? maxRows[0].maxNum : 0;

                        let completed = 0;
                        rows.forEach((row) => {
                            counter++;
                            const memberId = `KUCAAD-${String(counter).padStart(4, '0')}`;
                            db.query('UPDATE Users SET member_id = ? WHERE id = ?', [memberId, row.id], (err) => {
                                if (err) console.error(`Failed to set member_id for user ${row.id}:`, err.message);
                                else console.log(`  User #${row.id} → ${memberId}`);

                                completed++;
                                if (completed === rows.length) {
                                    console.log(`✅ Backfilled ${rows.length} users. Migration complete!`);
                                    process.exit(0);
                                }
                            });
                        });
                    }
                );
            });
        };

        if (cols.length > 0) {
            console.log('Column member_id already exists. Skipping ALTER.');
            backfillUsers();
        } else {
            const addColumnSQL = `ALTER TABLE Users ADD COLUMN member_id VARCHAR(20) UNIQUE AFTER id`;
            db.query(addColumnSQL, (err) => {
                if (err) {
                    console.error('Error adding column:', err.message);
                    process.exit(1);
                }
                console.log('✅ member_id column added successfully.');
                backfillUsers();
            });
        }
    });
};

migrate();
