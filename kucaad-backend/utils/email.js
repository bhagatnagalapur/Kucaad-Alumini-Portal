const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendWelcomeEmail = async (userEmail) => {
    try {
        await transporter.sendMail({
            from: '"KUCAAD Admin" <alumni.kud@kud.ac.in>',
            to: userEmail,
            subject: 'Welcome to the KUCAAD Network!',
            html: `<h3>Welcome to the official alumni directory!</h3>
                   <p>Please log in to complete your profile.</p>`
        });
        console.log('Welcome email sent to', userEmail);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};