const db = require('../config/db');

exports.getNotifications = (req, res) => {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 20);
    const offset = (page - 1) * limit;

    const query = `
        SELECT
            N.id,
            N.notice_id,
            N.title,
            N.message,
            N.read_at,
            N.created_at,
            NO.priority
        FROM Notifications N
        LEFT JOIN Notices NO ON N.notice_id = NO.id
        WHERE N.user_id = ?
        ORDER BY N.created_at DESC
        LIMIT ? OFFSET ?
    `;

    db.query(query, [userId, limit, offset], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to load notifications.' });

        db.query('SELECT COUNT(*) AS total FROM Notifications WHERE user_id = ?', [userId], (countErr, countResults) => {
            if (countErr) return res.status(500).json({ message: 'Failed to count notifications.' });

            db.query('SELECT COUNT(*) AS unread FROM Notifications WHERE user_id = ? AND read_at IS NULL', [userId], (unreadErr, unreadResults) => {
                if (unreadErr) return res.status(500).json({ message: 'Failed to count unread notifications.' });

                res.json({
                    data: results,
                    page,
                    limit,
                    total: countResults[0]?.total || 0,
                    totalPages: Math.max(Math.ceil((countResults[0]?.total || 0) / limit), 1),
                    unreadCount: unreadResults[0]?.unread || 0,
                });
            });
        });
    });
};

exports.markNotificationRead = (req, res) => {
    const userId = req.user.id;
    const notificationId = req.params.id;

    db.query(
        'UPDATE Notifications SET read_at = NOW() WHERE id = ? AND user_id = ?',
        [notificationId, userId],
        (err) => {
            if (err) return res.status(500).json({ message: 'Failed to update notification.' });
            res.json({ message: 'Notification marked as read.' });
        }
    );
};

exports.markAllRead = (req, res) => {
    const userId = req.user.id;

    db.query(
        'UPDATE Notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL',
        [userId],
        (err) => {
            if (err) return res.status(500).json({ message: 'Failed to mark notifications as read.' });
            res.json({ message: 'All notifications marked as read.' });
        }
    );
};
