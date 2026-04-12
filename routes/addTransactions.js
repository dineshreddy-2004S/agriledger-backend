const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/crops - Get all crops for the logged-in farmer
router.get('/crops', authenticateToken, async (req, res) => {
    try {
        const [crops] = await db.query('SELECT * FROM crops WHERE user_id = ?', [req.user.id]);
        res.json(crops);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch crops" });
    }
});

// GET /api/transactions - Get recent transactions
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const [txs] = await db.query(`
            SELECT t.* FROM transactions t
            JOIN crops c ON t.crop_id = c.id
            WHERE c.user_id = ?
            ORDER BY t.transaction_date DESC
        `, [req.user.id]);
        res.json(txs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

// POST /api/crops - Add a new crop
router.post('/crops', authenticateToken, async (req, res) => {
    const { name, season } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO crops (user_id, name, season) VALUES (?, ?, ?)',
            [req.user.id, name, season]
        );
        res.json({ message: "Crop added!", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Failed to add crop" });
    }
});

// POST /api/transactions - Record income/expense
router.post('/transactions', authenticateToken, async (req, res) => {
    const { crop_id, type, category, amount, transaction_date, description } = req.body;
    
    // Security check: Verify crop ownership
    const [cropCheck] = await db.query('SELECT id FROM crops WHERE id = ? AND user_id = ?', [crop_id, req.user.id]);
    if (cropCheck.length === 0) return res.status(403).json({ error: "Unauthorized access to this crop." });

    try {
        await db.query(
            'INSERT INTO transactions (crop_id, type, category, amount, transaction_date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [crop_id, type, category, amount, transaction_date, description]
        );
        res.json({ message: "Transaction recorded successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to record transaction" });
    }
});

// GET /api/reports - Financial breakdown per crop
router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                c.id as crop_id, c.name, c.season,
                SUM(CASE WHEN t.type = 'Income' THEN t.amount ELSE 0 END) as total_income,
                SUM(CASE WHEN t.type = 'Expense' THEN t.amount ELSE 0 END) as total_expense
            FROM crops c
            LEFT JOIN transactions t ON c.id = t.crop_id
            WHERE c.user_id = ?
            GROUP BY c.id
        `;
        const [report] = await db.query(query, [req.user.id]);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate report" });
    }
});

module.exports = router;