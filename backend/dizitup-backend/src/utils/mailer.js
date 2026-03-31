const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // This helps avoid connection issues on some hosting providers
    rejectUnauthorized: false
  }
});

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('❌ CRITICAL: EMAIL_USER or EMAIL_PASS environment variables are missing!');
}

// Verify SMTP connection on startup correctly
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('🚀 SMTP Server is ready to take our messages');
  }
});

module.exports = transporter;
