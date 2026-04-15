const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// ======================= CROPS =======================

router.get('/crops', authenticateToken, async (req, res) => {
    try {
        const [crops] = await db.query('SELECT * FROM crops WHERE user_id = ?', [req.user.id]);
        res.json(crops);
    } catch (error) {
        console.error("Fetch Crops Error:", error);
        res.status(500).json({ error: "Failed to fetch crops" });
    }
});

router.post('/crops', authenticateToken, async (req, res) => {
    const { name, season } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO crops (user_id, name, season, status) VALUES (?, ?, ?, "Active")',
            [req.user.id, name, season]
        );
        res.status(201).json({ message: "Crop added successfully!", id: result.insertId });
    } catch (error) {
        console.error("Add Crop Error:", error);
        res.status(500).json({ error: "Failed to add crop" });
    }
});

router.delete('/crops/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM crops WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: "Crop deleted" });
    } catch (error) {
        console.error("Delete Crop Error:", error);
        res.status(500).json({ error: "Failed to delete crop" });
    }
});

// ======================= TRANSACTIONS =======================

router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT t.*, c.name as crop_name 
            FROM transactions t
            JOIN crops c ON t.crop_id = c.id
            WHERE c.user_id = ?
            ORDER BY t.transaction_date DESC
        `;
        const [txs] = await db.query(query, [req.user.id]);
        res.json(txs);
    } catch (error) {
        console.error("Fetch Transactions Error:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

router.post('/transactions', authenticateToken, async (req, res) => {
    const { crop_id, type, category, amount, transaction_date, description } = req.body;
    try {
        // Security check: Ensure the user owns the crop
        const [crop] = await db.query('SELECT id FROM crops WHERE id = ? AND user_id = ?', [crop_id, req.user.id]);
        if (crop.length === 0) return res.status(403).json({ error: "Unauthorized access to this crop field." });

        await db.query(
            'INSERT INTO transactions (crop_id, type, category, amount, transaction_date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [crop_id, type, category, amount, transaction_date, description]
        );
        // Important: Send only ONE response and return immediately
        return res.status(201).json({ message: "Transaction recorded successfully" });
    } catch (error) {
        console.error("Post Transaction Error:", error);
        return res.status(500).json({ error: "Failed to record transaction" });
    }
});

router.delete('/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const query = `
            DELETE t FROM transactions t
            JOIN crops c ON t.crop_id = c.id
            WHERE t.id = ? AND c.user_id = ?
        `;
        await db.query(query, [req.params.id, req.user.id]);
        res.json({ message: "Transaction deleted" });
    } catch (error) {
        console.error("Delete Transaction Error:", error);
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

// ======================= LEDGERS =======================

router.get('/ledgers', authenticateToken, async (req, res) => {
    try {
        const [ledgers] = await db.query('SELECT * FROM ledgers WHERE user_id = ?', [req.user.id]);
        res.json(ledgers);
    } catch (error) {
        console.error("Fetch Ledgers Error:", error);
        res.status(500).json({ error: "Failed to fetch ledgers" });
    }
});

router.post('/ledgers', authenticateToken, async (req, res) => {
    const { name, type } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO ledgers (user_id, name, type) VALUES (?, ?, ?)',
            [req.user.id, name, type]
        );
        res.status(201).json({ message: "Ledger category added", id: result.insertId });
    } catch (error) {
        console.error("Add Ledger Error:", error);
        res.status(500).json({ error: "Failed to add ledger" });
    }
});

router.delete('/ledgers/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM ledgers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: "Ledger category deleted" });
    } catch (error) {
        console.error("Delete Ledger Error:", error);
        res.status(500).json({ error: "Failed to delete ledger" });
    }
});

// ======================= REPORTS =======================

router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                c.id as crop_id, c.name, c.season,
                COALESCE(SUM(CASE WHEN t.type = 'Income' THEN t.amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN t.type = 'Expense' THEN t.amount ELSE 0 END), 0) as total_expense
            FROM crops c
            LEFT JOIN transactions t ON c.id = t.crop_id
            WHERE c.user_id = ?
            GROUP BY c.id
        `;
        const [report] = await db.query(query, [req.user.id]);
        res.json(report);
    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({ error: "Failed to generate report" });
    }
});

module.exports = router;