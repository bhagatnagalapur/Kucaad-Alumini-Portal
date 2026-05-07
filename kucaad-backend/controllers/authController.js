const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../config/db');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify email connection
transporter.verify((error, success) => {
    if (error) {
        console.error('Nodemailer connection error:', error);
    } else {
        console.log('Nodemailer is ready to send emails!');
    }
});

// 1. Send OTP
exports.sendOTP = (req, res) => {
    const { email, full_name } = req.body;

    // Check if email already in use
    db.query('SELECT * FROM Users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.' });
        if (results.length > 0) return res.status(400).json({ message: 'Email already registered.' });

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        // Insert or update OTP in DB
        const query = `
            INSERT INTO OTP_Verifications (email, otp_code, expires_at, verified)
            VALUES (?, ?, ?, false)
            ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expires_at = VALUES(expires_at), verified = false
        `;
        db.query(query, [email, otpCode, expiresAt], (err) => {
            if (err) return res.status(500).json({ message: 'Failed to generate OTP.' });

            // Send Email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your KUCAAD Registration OTP',
                text: `Hello ${full_name},\n\nYour OTP for registration is: ${otpCode}\n\nIt expires in 10 minutes.\n\nThanks,\nKUCAAD Team`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Email error:', error);
                    return res.status(500).json({ message: 'Failed to send OTP email.' });
                }
                res.status(200).json({ message: 'OTP sent successfully to ' + email });
            });
        });
    });
};

// 2. Verify OTP
exports.verifyOTP = (req, res) => {
    const { email, otp } = req.body;

    const query = 'SELECT * FROM OTP_Verifications WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: 'No OTP requested for this email.' });

        const record = results[0];
        if (new Date() > new Date(record.expires_at)) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        if (record.otp_code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Mark as verified
        db.query('UPDATE OTP_Verifications SET verified = true WHERE email = ?', [email], (err) => {
            if (err) return res.status(500).json({ message: 'Database error.' });
            res.status(200).json({ message: 'OTP verified successfully!' });
        });
    });
};

// 3. Register (with verified OTP)
exports.register = async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
        // Check if OTP was verified
        db.query('SELECT verified FROM OTP_Verifications WHERE email = ?', [email], async (err, results) => {
            if (err || results.length === 0 || !results[0].verified) {
                return res.status(400).json({ message: 'Email not verified. Please complete OTP verification.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Generate member_id
            db.query(
                `SELECT MAX(CAST(SUBSTRING(member_id, 8) AS UNSIGNED)) AS maxNum FROM Users WHERE member_id IS NOT NULL`,
                (err, maxRows) => {
                    if (err) return res.status(500).json({ message: 'Database error.' });
                    
                    const next = ((maxRows[0] && maxRows[0].maxNum) || 0) + 1;
                    const memberId = `KUCAAD-${String(next).padStart(4, '0')}`;

                    // Insert into Users with member_id
                    db.query('INSERT INTO Users (member_id, email, password_hash) VALUES (?, ?, ?)', [memberId, email, hashedPassword], (err, userResults) => {
                        if (err) {
                            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already in use.' });
                            return res.status(500).json({ message: 'Database error during user creation.' });
                        }

                        const userId = userResults.insertId;

                        // Create initial Profile with full_name
                        db.query('INSERT INTO Profiles (user_id, full_name) VALUES (?, ?)', [userId, full_name], (err) => {
                            if (err) console.error('Failed to create profile skeleton:', err);
                            
                            // Cleanup OTP
                            db.query('DELETE FROM OTP_Verifications WHERE email = ?', [email]);
                            
                            res.status(201).json({ 
                                message: 'Registration successful!',
                                member_id: memberId,
                            });
                        });
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.login = (req, res) => {
    const { email, password, member_id } = req.body;
    
    // Support login via email OR member_id
    let query, param;
    if (member_id && member_id.trim()) {
        query = 'SELECT * FROM Users WHERE member_id = ?';
        param = member_id.trim();
    } else if (email && email.trim()) {
        query = 'SELECT * FROM Users WHERE email = ?';
        param = email.trim();
    } else {
        return res.status(400).json({ message: 'Email or Member ID is required.' });
    }
    
    db.query(query, [param], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });
        
        const user = results[0];

        // Check if account is approved
        if (user.status !== 'approved') {
            return res.status(403).json({ 
                message: user.status === 'pending' 
                    ? 'Your account is pending approval by the administrator.' 
                    : 'Your account has been rejected.' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ 
            message: 'Login successful', 
            token, 
            role: user.role, 
            member_id: user.member_id,
        });
    });
};