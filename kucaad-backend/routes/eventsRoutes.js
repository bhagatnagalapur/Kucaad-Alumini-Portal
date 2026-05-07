const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// ── GET /api/events — paginated list with RSVP status for current user ──────
router.get('/', verifyToken, (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 50);
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const query = `
        SELECT
          E.id, E.title, E.description, E.date, E.location,
          E.rsvp_count, E.created_at,
          U.email AS created_by,
          (SELECT COUNT(*) FROM EventRSVPs R WHERE R.event_id = E.id AND R.user_id = ?) AS has_rsvp
        FROM Events E
        JOIN users U ON E.created_by = U.id
        ORDER BY E.date ASC
        LIMIT ? OFFSET ?
    `;
    db.query(query, [userId, limit, offset], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        db.query('SELECT COUNT(*) AS total FROM Events', (countErr, countResults) => {
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

// ── POST /api/events — create event (Admin / Professor only) ─────────────────
router.post('/', verifyToken, (req, res) => {
    const { title, description, date, location } = req.body;
    const userId = req.user.id;

    if (!['Admin', 'admin', 'Professor'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to post events' });
    }
    if (!title || !date) {
        return res.status(400).json({ message: 'Title and date are required' });
    }

    const query = `INSERT INTO Events (title, description, date, location, created_by) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [title, description || '', date, location || null, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to post event', error: err });
        res.status(201).json({ message: 'Event posted successfully' });
    });
});

// ── DELETE /api/events/:id — delete event (Admin / Professor only) ───────────
router.delete('/:id', verifyToken, (req, res) => {
    if (!['Admin', 'admin', 'Professor'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to delete events' });
    }
    db.query('DELETE FROM Events WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Event not found' });
        res.json({ message: 'Event deleted successfully' });
    });
});

// ── POST /api/events/:id/rsvp — toggle RSVP for current user ────────────────
router.post('/:id/rsvp', verifyToken, (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Check if already RSVPed
    db.query(
        'SELECT id FROM EventRSVPs WHERE event_id = ? AND user_id = ?',
        [eventId, userId],
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });

            if (rows.length > 0) {
                // Cancel RSVP
                db.query('DELETE FROM EventRSVPs WHERE event_id = ? AND user_id = ?', [eventId, userId], (e2) => {
                    if (e2) return res.status(500).json({ message: 'Database error', error: e2 });
                    db.query('UPDATE Events SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE id = ?', [eventId], (e3) => {
                        if (e3) return res.status(500).json({ message: 'Database error', error: e3 });
                        res.json({ message: 'RSVP cancelled', rsvped: false });
                    });
                });
            } else {
                // Add RSVP
                db.query('INSERT INTO EventRSVPs (event_id, user_id) VALUES (?, ?)', [eventId, userId], (e2) => {
                    if (e2) return res.status(500).json({ message: 'Database error', error: e2 });
                    db.query('UPDATE Events SET rsvp_count = rsvp_count + 1 WHERE id = ?', [eventId], (e3) => {
                        if (e3) return res.status(500).json({ message: 'Database error', error: e3 });
                        res.json({ message: 'RSVP confirmed', rsvped: true });
                    });
                });
            }
        }
    );
});

module.exports = router;
