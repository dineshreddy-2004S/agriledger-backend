const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// ======================= CROPS =======================
router.get('/crops', authenticateToken, async (req, res) => {
    try {
        const [crops] = await db.query('SELECT * FROM crops WHERE user_id = ?', [req.user.id]);
        res.json(crops);
    } catch (error) { res.status(500).json({ error: "Failed to fetch crops" }); }
});

router.post('/crops', authenticateToken, async (req, res) => {
    const { name, season } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO crops (user_id, name, season) VALUES (?, ?, ?)',
            [req.user.id, name, season]
        );
        res.status(201).json({ message: "Crop added!", id: result.insertId });
    } catch (error) { res.status(500).json({ error: "Failed to add crop" }); }
});

router.delete('/crops/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM crops WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: "Crop deleted" });
    } catch (error) { res.status(500).json({ error: "Failed to delete crop" }); }
});

// ======================= TRANSACTIONS =======================
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const [txs] = await db.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC', [req.user.id]);
        res.json(txs);
    } catch (error) { res.status(500).json({ error: "Failed to fetch transactions" }); }
});

router.post('/transactions', authenticateToken, async (req, res) => {
    const { crop_id, type, category, amount, transaction_date, description } = req.body;
    try {
        await db.query(
            'INSERT INTO transactions (user_id, crop_id, type, category, amount, transaction_date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, crop_id, type, category, amount, transaction_date, description]
        );
        res.status(201).json({ message: "Transaction recorded" });
    } catch (error) { res.status(500).json({ error: "Failed to record transaction" }); }
});

router.put('/transactions/:id', authenticateToken, async (req, res) => {
    const { crop_id, type, category, amount, transaction_date, description } = req.body;
    try {
        await db.query(
            'UPDATE transactions SET crop_id=?, type=?, category=?, amount=?, transaction_date=?, description=? WHERE id=? AND user_id=?',
            [crop_id, type, category, amount, transaction_date, description, req.params.id, req.user.id]
        );
        res.json({ message: "Transaction updated" });
    } catch (error) { res.status(500).json({ error: "Failed to update transaction" }); }
});

router.delete('/transactions/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: "Transaction deleted" });
    } catch (error) { res.status(500).json({ error: "Failed to delete transaction" }); }
});

// ======================= LEDGERS =======================
router.get('/ledgers', authenticateToken, async (req, res) => {
    try {
        const [ledgers] = await db.query('SELECT * FROM ledgers WHERE user_id = ?', [req.user.id]);
        res.json(ledgers);
    } catch (error) { res.status(500).json({ error: "Failed to fetch ledgers" }); }
});

router.post('/ledgers', authenticateToken, async (req, res) => {
    const { name, type } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO ledgers (user_id, name, type) VALUES (?, ?, ?)',
            [req.user.id, name, type]
        );
        res.status(201).json({ message: "Ledger added", id: result.insertId });
    } catch (error) { res.status(500).json({ error: "Failed to add ledger" }); }
});

router.put('/ledgers/:id', authenticateToken, async (req, res) => {
    const { name, type } = req.body;
    try {
        await db.query(
            'UPDATE ledgers SET name=?, type=? WHERE id=? AND user_id=?',
            [name, type, req.params.id, req.user.id]
        );
        res.json({ message: "Ledger updated" });
    } catch (error) { res.status(500).json({ error: "Failed to update ledger" }); }
});

router.delete('/ledgers/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM ledgers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: "Ledger deleted" });
    } catch (error) { res.status(500).json({ error: "Failed to delete ledger" }); }
});

// ======================= REPORTS =======================
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