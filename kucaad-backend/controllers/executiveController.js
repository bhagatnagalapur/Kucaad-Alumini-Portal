const db = require('../config/db');

const DEFAULT_EXECUTIVES = [
    {
        name: 'Dr. Ananya Rao',
        role: 'President',
        bio: 'Leads alumni strategy and community engagement.',
        photo_url: '',
        order_index: 1,
    },
    {
        name: 'Mr. Kiran Shetty',
        role: 'Vice President',
        bio: 'Supports partnerships, events, and student outreach.',
        photo_url: '',
        order_index: 2,
    },
    {
        name: 'Ms. Megha Patil',
        role: 'Secretary',
        bio: 'Coordinates records, communication, and member updates.',
        photo_url: '',
        order_index: 3,
    },
    {
        name: 'Prof. R. Deshpande',
        role: 'Treasurer',
        bio: 'Oversees finance and association planning.',
        photo_url: '',
        order_index: 4,
    },
];

exports.getExecutiveMembers = (req, res) => {
    const query = `
        SELECT id, name, role, bio, photo_url, order_index, updated_at
        FROM ExecutiveCommitteeMembers
        ORDER BY order_index ASC, id ASC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to load executive members.' });

        if (!results.length) {
            return res.json(DEFAULT_EXECUTIVES.map((member, index) => ({ id: index + 1, ...member })));
        }

        res.json(results);
    });
};

exports.saveExecutiveMembers = (req, res) => {
    const { members } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(members)) {
        return res.status(400).json({ message: 'Members must be an array.' });
    }

    const sanitizedMembers = members
        .filter((member) => member && member.name && member.role)
        .map((member, index) => ({
            name: member.name.trim(),
            role: member.role.trim(),
            bio: (member.bio || '').trim(),
            photo_url: (member.photo_url || '').trim(),
            order_index: Number.isFinite(Number(member.order_index)) ? Number(member.order_index) : index + 1,
        }));

    const replaceAll = `DELETE FROM ExecutiveCommitteeMembers`;
    db.query(replaceAll, (deleteErr) => {
        if (deleteErr) return res.status(500).json({ message: 'Failed to clear existing executive members.' });

        if (!sanitizedMembers.length) {
            return res.json({ message: 'Executive members updated successfully.' });
        }

        const insertQuery = `
            INSERT INTO ExecutiveCommitteeMembers (name, role, bio, photo_url, order_index, updated_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const pending = sanitizedMembers.length;
        let completed = 0;
        let failed = false;

        sanitizedMembers.forEach((member) => {
            db.query(
                insertQuery,
                [member.name, member.role, member.bio, member.photo_url, member.order_index, userId],
                (insertErr) => {
                    if (failed) return;
                    if (insertErr) {
                        failed = true;
                        return res.status(500).json({ message: 'Failed to save executive members.' });
                    }

                    completed += 1;
                    if (completed === pending) {
                        res.json({ message: 'Executive members updated successfully.' });
                    }
                }
            );
        });
    });
};
