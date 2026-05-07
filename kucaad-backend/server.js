require('dotenv').config();
const express = require('express');
const cors = require('cors'); // <--- Imported only once!
require('./config/db'); 

const app = express();
app.set('trust proxy', 1);

// Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
})); // <--- Used only once!
app.use(express.json());

const createRateLimiter = ({ windowMs, max }) => {
    const hits = new Map();
    return (req, res, next) => {
        const key = req.ip || req.headers['x-forwarded-for'] || 'global';
        const now = Date.now();
        const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };

        if (now > entry.resetAt) {
            entry.count = 0;
            entry.resetAt = now + windowMs;
        }

        entry.count += 1;
        hits.set(key, entry);

        if (entry.count > max) {
            return res.status(429).json({ message: 'Too many requests. Please try again later.' });
        }

        next();
    };
};

// Import Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const jobsRoutes = require('./routes/jobsRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const noticesRoutes = require('./routes/noticesRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

// Mount Routes
app.use('/api/auth/login', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/auth/send-otp', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/notifications', notificationsRoutes);

// Base route for testing
app.get('/', (req, res) => {
    res.send('KUCAAD API is live.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
