require('dotenv').config(); // Allows local testing
const express = require('express');
const cors = require('cors');

// --- 1. SILENT CRASH CATCHERS ---
// This forces Render to tell us if it dies during startup
process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT ERROR:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// --- 2. MIDDLEWARE ---
// The '*' fixes the Vercel CORS issue by allowing all frontend links
app.use(cors({ origin: '*' })); 
// This allows your server to read the email/password sent from React
app.use(express.json()); 

// --- 3. HEALTH CHECK ---
// A simple route to prove the server is alive
app.get('/health', (req, res) => {
    res.status(200).send("✅ Backend is alive, awake, and ready!");
});

// --- 4. IMPORT YOUR ROUTES ---
// Based on your logs, you have an authRoutes file. 
// (Adjust the path './routes/authRoutes' if your folder structure is different)
const authRoutes = require('./routes/authRoutes'); 
app.use('/api', authRoutes);

// --- 5. GLOBAL ERROR LOGGER ---
// If the database fails, this catches the 500 error and PRINTS it to Render Logs
app.use((err, req, res, next) => {
    console.error("🔥 DATABASE/SERVER ERROR:", err.stack);
    res.status(500).json({ 
        message: "Internal Server Error", 
        error: err.message 
    });
});

// --- 6. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running successfully on port ${PORT}`);
});