const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const farmerRoutes = require('./routes/farmerRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(cors({
    origin: 'https://agriledger-frontend-5gvvfqq9m-vdineshreddy7228-6134s-projects.vercel.app/', // Or '*' to allow everything for now
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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