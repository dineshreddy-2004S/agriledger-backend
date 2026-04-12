const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../config/db');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_farm_key_123';

// Configure your email transport (Example using Gmail)
// In production, move these credentials to your .env file
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with your email
    pass: process.env.EMAIL_PASS || 'your-app-password'     // Replace with your app password
  }
});

// ==========================================
// 1. SIGN UP ROUTE
// ==========================================
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        res.status(201).json({ message: "Registration successful! Please wait for Admin approval." });
    } catch (error) {
        res.status(500).json({ error: "Error creating user. Email might exist." });
    }
});

// ==========================================
// 2. SIGN IN ROUTE
// ==========================================
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ error: "User not found" });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) return res.status(400).json({ error: "Invalid password" });

        // Check if Admin has approved the user
        if (!user.is_approved && user.role !== 'admin') {
            return res.status(403).json({ error: "Your account is pending Admin approval." });
        }

        const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ==========================================
// 3. FORGOT PASSWORD ROUTE
// ==========================================
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // For security, don't reveal if the email exists or not to prevent enumeration
            return res.json({ message: "If your email is registered, a reset link has been sent." });
        }

        const user = users[0];
        
        // Generate a temporary reset token (valid for 15 mins)
        const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`; // Make sure this matches your frontend URL

        // Send the email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: user.email,
            subject: 'AgriLedger - Password Reset Request',
            html: `
                <h3>Password Reset</h3>
                <p>Hello ${user.name},</p>
                <p>You requested a password reset. Click the link below to reset your password. This link is valid for 15 minutes.</p>
                <a href="${resetLink}">Reset My Password</a>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "If your email is registered, a reset link has been sent." });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ error: "Failed to process password reset. Please check email configuration." });
    }
});

// ==========================================
// 4. FORGOT USER ROUTE
// ==========================================
router.post('/forgot-user', async (req, res) => {
    const { name } = req.body;
    try {
        const [users] = await db.query('SELECT email FROM users WHERE name = ? LIMIT 1', [name]);
        if (users.length === 0) {
            return res.status(404).json({ error: "We couldn't find an account with that name." });
        }
        
        // Mask the email slightly for security (e.g., jo***@gmail.com)
        const email = users[0].email;
        const maskedEmail = email.replace(/(.{2})(.*)(?=@)/,
            (gp1, gp2, gp3) => { 
                return gp2 + gp3.replace(/./g, '*') 
            }
        );

        res.json({ message: `Account found! Your registered email is: ${maskedEmail}` });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;