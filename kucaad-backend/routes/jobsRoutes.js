const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all jobs
router.get('/', verifyToken, (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = (page - 1) * limit;
    const query = `
        SELECT J.id, J.title, J.company, J.description, J.created_at, U.email as posted_by
        FROM Jobs J
        JOIN Users U ON J.posted_by = U.id
        ORDER BY J.created_at DESC
        LIMIT ? OFFSET ?
    `;
    db.query(query, [limit, offset], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        db.query('SELECT COUNT(*) AS total FROM Jobs', (countErr, countResults) => {
            if (countErr) return res.status(500).json({ message: 'Database error', error: countErr });
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
});

// Post a new job
router.post('/', verifyToken, (req, res) => {
    const { title, company, description } = req.body;
    const userId = req.user.id;

    const query = `INSERT INTO Jobs (title, company, description, posted_by) VALUES (?, ?, ?, ?)`;
    db.query(query, [title, company, description, userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to post job', error: err });
        res.status(201).json({ message: 'Job posted successfully' });
    });
});

module.exports = router;
