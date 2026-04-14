const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// ======================= CROPS =======================

/**
 * @route   GET /api/crops
 * @desc    Retrieve all crops belonging to the logged-in farmer
 */
router.get('/crops', authenticateToken, async (req, res) => {
    try {
        // We use req.user.id which comes from the decoded JWT token
        const [crops] = await db.query('SELECT * FROM crops WHERE user_id = ?', [req.user.id]);
        res.json(crops);
    } catch (error) {
        console.error("Error fetching crops:", error);
        res.status(500).json({ error: "Failed to fetch crops" });
    }
});

/**
 * @route   POST /api/crops
 * @desc    Add a new crop field
 */
router.post('/crops', authenticateToken, async (req, res) => {
    const { name, season } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO crops (user_id, name, season, status) VALUES (?, ?, ?, "Active")',
            [req.user.id, name, season]
        );
        res.status(201).json({ message: "Crop added!", id: result.insertId });
    } catch (error) {
        console.error("Error adding crop:", error);
        res.status(500).json({ error: "Failed to add crop" });
    }
});

/**
 * @route   DELETE /api/crops/:id
 * @desc    Remove a crop and its associated data
 */
router.delete('/crops/:id', authenticateToken, async (req, res) => {
    try {
        // Ensure the crop actually belongs to this user before deleting
        const [result] = await db.query('DELETE FROM crops WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Crop not found or unauthorized" });
        }
        res.json({ message: "Crop deleted successfully" });
    } catch (error) {
        console.error("Error deleting crop:", error);
        res.status(500).json({ error: "Failed to delete crop" });
    }
});

// ======================= TRANSACTIONS =======================

/**
 * @route   GET /api/transactions
 * @desc    Retrieve transactions. We JOIN with crops to ensure we only get
 * transactions for crops that belong to the logged-in user.
 */
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        // Optimized query: Fetches transactions by joining with the crops table
        // to verify ownership, since transactions usually don't have user_id directly.
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
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

/**
 * @route   POST /api/transactions
 * @desc    Record a new financial entry
 */
router.post('/transactions', authenticateToken, async (req, res) => {
    const { crop_id, type, category, amount, transaction_date, description } = req.body;
    try {
        // Security check: Verify the crop belongs to the user before inserting a transaction for it
        const [crop] = await db.query('SELECT id FROM crops WHERE id = ? AND user_id = ?', [crop_id, req.user.id]);
        if (crop.length === 0) return res.status(403).json({ error: "Unauthorized: You do not own this crop field." });

        await db.query(
            'INSERT INTO transactions (crop_id, type, category, amount, transaction_date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [crop_id, type, category, amount, transaction_date, description]
        );
        res.status(201).json({ message: "Transaction recorded successfully" });
    } catch (error) {
        console.error("Error recording transaction:", error);
        res.status(500).json({ error: "Failed to record transaction" });
    }
});

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update an existing transaction
 */
router.put('/transactions/:id', authenticateToken, async (req, res) => {
    const { crop_id, type, category, amount, transaction_date, description } = req.body;
    try {
        // We join with crops in the WHERE clause to ensure the user can only update their own data
        const query = `
            UPDATE transactions t
            JOIN crops c ON t.crop_id = c.id
            SET t.crop_id=?, t.type=?, t.category=?, t.amount=?, t.transaction_date=?, t.description=?
            WHERE t.id=? AND c.user_id=?
        `;
        const [result] = await db.query(query, [crop_id, type, category, amount, transaction_date, description, req.params.id, req.user.id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ error: "Transaction not found or unauthorized" });
        res.json({ message: "Transaction updated" });
    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ error: "Failed to update transaction" });
    }
});

/**
 * @route   DELETE /api/transactions/:id
 */
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
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

// ======================= LEDGERS =======================

router.get('/ledgers', authenticateToken, async (req, res) => {
    try {
        const [ledgers] = await db.query('SELECT * FROM ledgers WHERE user_id = ?', [req.user.id]);
        res.json(ledgers);
    } catch (error) {
        console.error("Error fetching ledgers:", error);
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
        res.status(201).json({ message: "Ledger category created", id: result.insertId });
    } catch (error) {
        console.error("Error adding ledger:", error);
        res.status(500).json({ error: "Failed to add ledger category" });
    }
});

router.delete('/ledgers/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM ledgers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: "Ledger category deleted" });
    } catch (error) {
        console.error("Error deleting ledger:", error);
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
        console.error("Error generating report:", error);
        res.status(500).json({ error: "Failed to generate financial report" });
    }
});

module.exports = router;