// 1. Add this at the VERY top of server.js (before anything else)
process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT ERROR:', err);
});

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 2. Ensure CORS is open (The "Slash" issue we found earlier)
const cors = require('cors');
app.use(cors({ origin: '*' })); // Temporarily allow everything to bypass CORS blocks

app.use(express.json());

// 3. Add this test route to check if the server is even breathing
app.get('/health', (req, res) => {
    res.status(200).send("Server is alive");
});
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const farmerRoutes = require('./routes/farmerRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
    console.log("Test endpoint hit!");
    res.send("Backend is working!");
});

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', farmerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Farm Accounting Backend running on port ${PORT}`);
});

// 4. Add this at the VERY BOTTOM of server.js (after all routes)
app.use((err, req, res, next) => {
    console.error("SERVER ERROR LOG:", err.stack); // This prints to Render Logs
    res.status(500).json({ error: "Internal Server Error", details: err.message });
});