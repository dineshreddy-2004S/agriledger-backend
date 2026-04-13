require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- 1. SILENT CRASH CATCHERS ---
process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT ERROR:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// --- 2. MIDDLEWARE ---
app.use(cors({ origin: '*' })); // Allows your Vercel frontend to talk to this backend
app.use(express.json());        // Allows the server to read JSON data from the frontend

// --- 3. HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.status(200).send("✅ Backend is alive and routing perfectly!");
});

// --- 4. IMPORT YOUR ROUTE FILES ---
// NOTE: This assumes your files are inside a folder named "routes"
// If they are in the same folder as server.js, change './routes/' to './'
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const addTransactions = require('./routes/addTransactions');
const farmerRoutes = require('./routes/farmerRoutes');

// --- 5. CONNECT ROUTES TO THE '/api' URL ---
// Every time a request starts with '/api', Express will check these files
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', addTransactions);
app.use('/api', farmerRoutes);

// --- 6. GLOBAL ERROR LOGGER ---
// Catches any database crashes and prints them to the Render logs
app.use((err, req, res, next) => {
    console.error("🔥 DATABASE/SERVER ERROR:", err.stack);
    res.status(500).json({ 
        message: "Internal Server Error", 
        error: err.message 
    });
});

// --- 7. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running successfully on port ${PORT}`);
});