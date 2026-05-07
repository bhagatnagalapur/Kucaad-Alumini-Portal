const db = require('../config/db');

const DEFAULT_ABOUT = {
    title: 'About Us',
    summary: 'KUCAAD connects alumni, faculty, and students through mentorship, opportunities, and shared university pride.',
    mission: 'Build a strong, active alumni network that supports careers, collaboration, and lifelong learning.',
    vision: 'Create a vibrant community where every KUCAAD member stays connected and contributes back.',
    what_we_do: "Share alumni stories, post opportunities, highlight events, and celebrate the association's journey.",
};

exports.getAboutUs = (req, res) => {
    const query = `SELECT id, title, summary, mission, vision, what_we_do, updated_at FROM AboutUsContent WHERE id = 1 LIMIT 1`;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to load About Us content.' });

        if (!results.length) {
            return res.json({ id: 1, ...DEFAULT_ABOUT });
        }

        res.json(results[0]);
    });
};

exports.saveAboutUs = (req, res) => {
    const { title, summary, mission, vision, what_we_do } = req.body;
    const userId = req.user.id;

    if (!title || !summary || !mission || !vision || !what_we_do) {
        return res.status(400).json({ message: 'All About Us fields are required.' });
    }

    const query = `
        INSERT INTO AboutUsContent (id, title, summary, mission, vision, what_we_do, updated_by)
        VALUES (1, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        summary = VALUES(summary),
        mission = VALUES(mission),
        vision = VALUES(vision),
        what_we_do = VALUES(what_we_do),
        updated_by = VALUES(updated_by)
    `;

    db.query(query, [title, summary, mission, vision, what_we_do, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to save About Us content.' });
        res.json({ message: 'About Us content updated successfully.' });
    });
};
