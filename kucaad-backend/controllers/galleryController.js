const db = require('../config/db');

exports.getGalleryItems = (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 50);
    const offset = (page - 1) * limit;
    const query = `
        SELECT G.id, G.title, G.description, G.image_data, G.created_at, U.email AS created_by
        FROM GalleryItems G
        JOIN Users U ON G.created_by = U.id
        ORDER BY G.created_at DESC
        LIMIT ? OFFSET ?
    `;

    db.query(query, [limit, offset], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.', error: err });
        db.query('SELECT COUNT(*) AS total FROM GalleryItems', (countErr, countResults) => {
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

exports.createGalleryItem = (req, res) => {
    const { title, description, image_data } = req.body;
    const userId = req.user.id;

    if (!title || !image_data) {
        return res.status(400).json({ message: 'Title and image are required.' });
    }

    const query = `
        INSERT INTO GalleryItems (title, description, image_data, created_by)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [title, description || '', image_data, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to save gallery item.', error: err });
        res.status(201).json({ message: 'Gallery item uploaded successfully.' });
    });
};
