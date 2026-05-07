const db = require('../config/db');
const bcrypt = require('bcrypt');

// ── Helper: generate next KUCAAD-XXXX member ID ──
function generateMemberId(callback) {
    db.query(
        `SELECT MAX(CAST(SUBSTRING(member_id, 8) AS UNSIGNED)) AS maxNum FROM Users WHERE member_id IS NOT NULL`,
        (err, rows) => {
            if (err) return callback(err, null);
            const next = ((rows[0] && rows[0].maxNum) || 0) + 1;
            callback(null, `KUCAAD-${String(next).padStart(4, '0')}`);
        }
    );
}

// View all pending user approvals
exports.getPendingApprovals = (req, res) => {
    const query = `
        SELECT U.id, U.email, U.role, P.full_name, P.course, P.graduation_year 
        FROM Users U
        JOIN Profiles P ON U.id = P.user_id
        WHERE U.status = 'pending'
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.', error: err.message });
        res.json(results);
    });
};

// Approve or reject a user
exports.updateUserStatus = (req, res) => {
    const userId = req.params.id;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
    }

    db.query('UPDATE Users SET status = ? WHERE id = ?', [status, userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to update user status.' });
        res.json({ message: `User ${status} successfully.` });
    });
};

// --- Job Moderation ---
exports.getPendingJobs = (req, res) => {
    const query = `SELECT J.*, P.full_name FROM Jobs J JOIN Profiles P ON J.posted_by = P.user_id WHERE J.status = 'pending'`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.' });
        res.json(results);
    });
};

exports.updateJobStatus = (req, res) => {
    const jobId = req.params.id;
    const { status } = req.body;
    db.query('UPDATE Jobs SET status = ? WHERE id = ?', [status, jobId], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to update job status.' });
        res.json({ message: `Job ${status} successfully.` });
    });
};

// --- Event Moderation ---
exports.getPendingEvents = (req, res) => {
    const query = `SELECT E.*, P.full_name FROM Events E JOIN Profiles P ON E.created_by = P.user_id WHERE E.status = 'pending'`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.' });
        res.json(results);
    });
};

exports.updateEventStatus = (req, res) => {
    const eventId = req.params.id;
    const { status } = req.body;
    db.query('UPDATE Events SET status = ? WHERE id = ?', [status, eventId], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to update event status.' });
        res.json({ message: `Event ${status} successfully.` });
    });
};

// ══════════════════════════════════════════════════════════
//  Admin creates a new user profile
// ══════════════════════════════════════════════════════════
exports.createUser = async (req, res) => {
    const { email, password, full_name, role, course, graduation_year } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ message: 'Email, password, and full name are required.' });
    }

    try {
        // Check for duplicate email
        db.query('SELECT id FROM Users WHERE email = ?', [email], async (err, existing) => {
            if (err) return res.status(500).json({ message: 'Database error.' });
            if (existing.length > 0) return res.status(400).json({ message: 'Email already registered.' });

            const hashedPassword = await bcrypt.hash(password, 10);

            // Generate unique member ID
            generateMemberId((err, memberId) => {
                if (err) return res.status(500).json({ message: 'Failed to generate member ID.' });

                const validRole = ['Student', 'Professor', 'Executive Member', 'Admin'].includes(role) ? role : 'Student';

                // Insert user with member_id
                db.query(
                    'INSERT INTO Users (member_id, email, password_hash, role) VALUES (?, ?, ?, ?)',
                    [memberId, email, hashedPassword, validRole],
                    (err, userResult) => {
                        if (err) {
                            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email or member ID already exists.' });
                            return res.status(500).json({ message: 'Failed to create user.', error: err.message });
                        }

                        const userId = userResult.insertId;

                        // Create profile
                        db.query(
                            'INSERT INTO Profiles (user_id, full_name, course, graduation_year) VALUES (?, ?, ?, ?)',
                            [userId, full_name, course || null, graduation_year || null],
                            (err) => {
                                if (err) console.error('Failed to create profile:', err.message);

                                res.status(201).json({
                                    message: 'User created successfully!',
                                    member_id: memberId,
                                    user: {
                                        id: userId,
                                        member_id: memberId,
                                        email,
                                        full_name,
                                        role: validRole,
                                    },
                                });
                            }
                        );
                    }
                );
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════
//  Admin updates a user's role
// ══════════════════════════════════════════════════════════
exports.updateUserRole = (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    const validRoles = ['Student', 'Professor', 'Executive Member', 'Admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    db.query('UPDATE Users SET role = ? WHERE id = ?', [role, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to update role.' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
        res.json({ message: `Role updated to ${role} successfully.` });
    });
};

// Admin table view: users + profile details with pagination/search filters
exports.getUsersTable = (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const search = String(req.query.search || '').trim();
    const year = String(req.query.year || '').trim();
    const role = String(req.query.role || '').trim();

    const where = [];
    const params = [];

    if (search) {
        where.push(`(P.full_name LIKE ? OR U.email LIKE ? OR P.company LIKE ? OR P.course LIKE ? OR U.member_id LIKE ?)`);
        const likeValue = `%${search}%`;
        params.push(likeValue, likeValue, likeValue, likeValue, likeValue);
    }

    if (year) {
        where.push(`(P.graduation_year = ? OR (P.batch_type = 'range' AND ? BETWEEN P.batch_start_year AND P.batch_end_year))`);
        params.push(year, year);
    }

    if (role) {
        where.push(`U.role = ?`);
        params.push(role);
    }

    const whereClause = where.length ? ` WHERE ${where.join(' AND ')}` : '';

    const dataQuery = `
        SELECT
            U.id,
            U.member_id,
            U.email,
            U.role,
            U.created_at,
            P.full_name,
            P.course,
            P.graduation_year,
            P.batch_type,
            P.batch_label,
            P.current_job,
            P.company,
            P.linkedin_url
        FROM Users U
        LEFT JOIN Profiles P ON P.user_id = U.id
        ${whereClause}
        ORDER BY U.created_at DESC
        LIMIT ? OFFSET ?
    `;

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM Users U
        LEFT JOIN Profiles P ON P.user_id = U.id
        ${whereClause}
    `;

    db.query(dataQuery, [...params, limit, offset], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to load users table.', error: err.message });
        }

        db.query(countQuery, params, (countErr, countRows) => {
            if (countErr) {
                return res.status(500).json({ message: 'Failed to load users count.', error: countErr.message });
            }

            const total = countRows[0]?.total || 0;
            res.json({
                data: rows,
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1),
            });
        });
    });
};
