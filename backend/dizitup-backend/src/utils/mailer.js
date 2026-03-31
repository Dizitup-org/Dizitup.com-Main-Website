const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false, // Use STARTTLS for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // This helps avoid connection issues on some hosting providers
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // Wait 10 seconds before timing out
  greetingTimeout: 5000,    // Timeout for initial greeting
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
