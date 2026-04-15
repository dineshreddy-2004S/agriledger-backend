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
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- 3. IMPORT ROUTES WITH SAFETY CHECKS ---
// If these paths are wrong, Render will show "FAILED TO LOAD" in logs.
const loadRoute = (path) => {
    try {
        const route = require(path);
        if (!route || typeof route !== 'function') {
            console.error(`❌ ROUTE ERROR: ${path} did not export a Router function!`);
            return null;
        }
        return route;
    } catch (err) {
        console.error(`❌ FAILED TO LOAD ROUTE FILE: ${path}`);
        console.error(err.message);
        return null;
    }
};

const authRoutes = loadRoute('./routes/authRoutes');
const adminRoutes = loadRoute('./routes/adminRoutes');
const farmerRoutes = loadRoute('./routes/farmerRoutes');

// --- 4. WIRING UP ROUTES ---
// We check if the route exists before using it to prevent the "handler must be a function" crash
if (authRoutes) app.use('/api', authRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (farmerRoutes) app.use('/api', farmerRoutes);

// --- 5. HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.status(200).send("✅ Backend is alive and routing perfectly!");
});

// --- 6. GLOBAL ERROR LOGGER ---
app.use((err, req, res, next) => {
    console.error("🔥 SERVER ERROR:", err.stack);
    res.status(500).json({ 
        message: "Internal Server Error", 
        error: err.message 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running successfully on port ${PORT}`);
});

