const db = require('../config/db');

// Create or update user profile
exports.createProfile = (req, res) => {
    const {
        full_name,
        course,
        graduation_year,
        batch_type,
        batch_mode,
        batch_year,
        batch_start_year,
        batch_end_year,
        batch_label,
        current_job,
        company,
        linkedin_url,
        bio,
    } = req.body;
    const userId = req.user.id; 
    const resolvedBatchType = batch_type === 'range' || batch_mode === 'range' ? 'range' : 'year';
    const resolvedBatchYear = graduation_year || batch_year || batch_start_year || null;
    const resolvedStartYear = batch_start_year || graduation_year || batch_year || null;
    const resolvedEndYear = batch_end_year || graduation_year || batch_year || null;
    const resolvedBatchLabel =
        batch_label ||
        (resolvedBatchType === 'range'
            ? `${resolvedStartYear}-${String(resolvedEndYear).slice(-2)}`
            : String(resolvedBatchYear || ''));

    const query = `
        INSERT INTO Profiles (
            user_id, full_name, course, graduation_year, batch_type, batch_year, batch_start_year, batch_end_year, batch_label,
            current_job, company, linkedin_url, bio
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        full_name = VALUES(full_name), course = VALUES(course), graduation_year = VALUES(graduation_year),
        batch_type = VALUES(batch_type), batch_year = VALUES(batch_year), batch_start_year = VALUES(batch_start_year),
        batch_end_year = VALUES(batch_end_year), batch_label = VALUES(batch_label), current_job = VALUES(current_job),
        company = VALUES(company), linkedin_url = VALUES(linkedin_url), bio = VALUES(bio)
    `;
    
    db.query(
        query,
        [
            userId,
            full_name,
            course,
            resolvedBatchYear,
            resolvedBatchType,
            resolvedBatchYear,
            resolvedStartYear,
            resolvedEndYear,
            resolvedBatchLabel || null,
            current_job,
            company,
            linkedin_url,
            bio,
        ],
        (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to update profile.', error: err });
        res.status(200).json({ message: 'Profile updated successfully.' });
    });
};

// Get the directory (Searchable by Year or Name)
exports.getDirectory = (req, res) => {
    const { year, name, batch_type, batch_mode, batch_label, batch_start_year, batch_end_year } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const offset = (page - 1) * limit;
    let query = `SELECT P.full_name, P.course, P.graduation_year, P.batch_type, P.batch_year, P.batch_start_year, P.batch_end_year, P.batch_label, P.current_job, P.company, P.linkedin_url, U.email 
                 FROM Profiles P
                 JOIN Users U ON P.user_id = U.id`;
    let queryParams = [];

    if (year || name || batch_label || batch_start_year || batch_end_year) {
        query += ` WHERE`;
        let conditions = [];
        if (batch_type === 'range' || batch_mode === 'range') {
            if (batch_label) {
                conditions.push(` P.batch_label = ?`);
                queryParams.push(batch_label);
            } else if (batch_start_year && batch_end_year) {
                conditions.push(` P.batch_type = 'range' AND P.batch_start_year = ? AND P.batch_end_year = ?`);
                queryParams.push(batch_start_year, batch_end_year);
            }
        } else if (year) {
            conditions.push(` (P.graduation_year = ? OR (P.batch_type = 'range' AND ? BETWEEN P.batch_start_year AND P.batch_end_year))`);
            queryParams.push(year, year);
        }
        if (name) {
            conditions.push(` P.full_name LIKE ?`);
            queryParams.push(`%${name}%`);
        }
        query += conditions.join(' AND ');
    }

    query += ` ORDER BY P.graduation_year DESC, P.full_name ASC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    db.query(query, queryParams, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.', error: err });
        let countQuery = `SELECT COUNT(*) AS total FROM Profiles P JOIN Users U ON P.user_id = U.id`;
        let countParams = [];

        if (year || name || batch_label || batch_start_year || batch_end_year) {
            countQuery += ` WHERE`;
            let conditions = [];
            if (batch_type === 'range' || batch_mode === 'range') {
                if (batch_label) {
                    conditions.push(` P.batch_label = ?`);
                    countParams.push(batch_label);
                } else if (batch_start_year && batch_end_year) {
                    conditions.push(` P.batch_type = 'range' AND P.batch_start_year = ? AND P.batch_end_year = ?`);
                    countParams.push(batch_start_year, batch_end_year);
                }
            } else if (year) {
                conditions.push(` (P.graduation_year = ? OR (P.batch_type = 'range' AND ? BETWEEN P.batch_start_year AND P.batch_end_year))`);
                countParams.push(year, year);
            }
            if (name) {
                conditions.push(` P.full_name LIKE ?`);
                countParams.push(`%${name}%`);
            }
            countQuery += conditions.join(' AND ');
        }

        db.query(countQuery, countParams, (countErr, countResults) => {
            if (countErr) return res.status(500).json({ message: 'Database error.', error: countErr });

            const total = countResults[0]?.total || 0;
            res.json({
                data: results,
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1),
            });
        });
    });
};
