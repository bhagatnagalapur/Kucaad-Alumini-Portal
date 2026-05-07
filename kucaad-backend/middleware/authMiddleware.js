const jwt = require('jsonwebtoken');

// Verifies if the user is logged in
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ message: 'No token provided. Access denied.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized. Invalid token.' });
        req.user = decoded; // Attaches the user payload (id, role) to the request
        next();
    });
};

// Verifies if the logged-in user is an admin
exports.verifyAdmin = (req, res, next) => {
    if (!['Admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
};

exports.verifyGalleryContributor = (req, res, next) => {
    if (!['Admin', 'admin', 'Executive Member', 'executive member'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Gallery upload access required.' });
    }
    next();
};
