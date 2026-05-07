const db = require('../config/db');

exports.getNotices = (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 20);
    const offset = (page - 1) * limit;

    const query = `
        SELECT N.id, N.title, N.body, N.priority, N.created_at, N.expires_at, U.email AS created_by
        FROM Notices N
        LEFT JOIN Users U ON N.created_by = U.id
        ORDER BY N.created_at DESC
        LIMIT ? OFFSET ?
    `;

    db.query(query, [limit, offset], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to load notices.' });

        db.query('SELECT COUNT(*) AS total FROM Notices', (countErr, countResults) => {
            if (countErr) return res.status(500).json({ message: 'Failed to count notices.' });

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

function chunkArray(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

exports.createNotice = (req, res) => {
    const { title, body, priority = 'Normal', expires_at } = req.body;
    const userId = req.user.id;

    if (!title || !body) {
        return res.status(400).json({ message: 'Title and body are required.' });
    }

    const query = `
        INSERT INTO Notices (title, body, priority, created_by, expires_at)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [title, body, priority, userId, expires_at || null], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to create notice.' });

        db.query('SELECT id FROM Users', (usersErr, users) => {
            if (usersErr) return res.status(201).json({ message: 'Notice created, but notifications could not be generated.' });

            const userIds = users.map((row) => row.id);
            if (!userIds.length) {
                return res.status(201).json({ message: 'Notice created successfully.' });
            }

            const notifications = userIds.map((uid) => [
                uid,
                result.insertId,
                title,
                body,
            ]);

            const chunks = chunkArray(notifications, 250);

            const insertChunk = (index) => {
                if (index >= chunks.length) {
                    return res.status(201).json({ message: 'Notice created successfully.' });
                }

                db.query(
                    'INSERT INTO Notifications (user_id, notice_id, title, message) VALUES ?',
                    [chunks[index]],
                    (notifyErr) => {
                        if (notifyErr) {
                            return res.status(201).json({ message: 'Notice created, but notifications were only partially generated.' });
                        }
                        insertChunk(index + 1);
                    }
                );
            };

            insertChunk(0);
        });
    });
};
