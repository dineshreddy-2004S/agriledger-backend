const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/transactions
 * @desc    Retrieve all transactions for the logged-in farmer.
 * We JOIN with the crops table to ensure we only see transactions 
 * for crops owned by this user.
 */
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
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

/**
 * @route   POST /api/transactions
 * @desc    Add a new transaction. 
 * Includes a security check to ensure the farmer owns the crop field.
 */
router.post('/transactions', authenticateToken, async (req, res) => {
    const { crop_id, type, category, amount, transaction_date, description } = req.body;
    
    try {
        // SECURITY CHECK: Does this farmer actually own the crop they are trying to add a transaction to?
        const [cropCheck] = await db.query('SELECT id FROM crops WHERE id = ? AND user_id = ?', [crop_id, req.user.id]);
        
        if (cropCheck.length === 0) {
            return res.status(403).json({ error: "Unauthorized: You do not have access to this crop field." });
        }

        const query = `
            INSERT INTO transactions (crop_id, type, category, amount, transaction_date, description) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.query(query, [crop_id, type, category, amount, transaction_date, description]);
        
        res.status(201).json({ message: "Transaction recorded successfully" });
    } catch (error) {
        console.error("Error adding transaction:", error);
        res.status(500).json({ error: "Failed to record transaction" });
    }
});

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update an existing transaction.
 */
router.put('/transactions/:id', authenticateToken, async (req, res) => {
    const { crop_id, type, category, amount, transaction_date, description } = req.body;
    const txId = req.params.id;

    try {
        // Verify ownership via JOIN before updating
        const updateQuery = `
            UPDATE transactions t
            JOIN crops c ON t.crop_id = c.id
            SET t.crop_id=?, t.type=?, t.category=?, t.amount=?, t.transaction_date=?, t.description=?
            WHERE t.id=? AND c.user_id=?
        `;
        
        const [result] = await db.query(updateQuery, [
            crop_id, type, category, amount, transaction_date, description, txId, req.user.id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Transaction not found or access denied." });
        }

        res.json({ message: "Transaction updated successfully" });
    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ error: "Failed to update transaction" });
    }
});

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a specific transaction.
 */
router.delete('/transactions/:id', authenticateToken, async (req, res) => {
    const txId = req.params.id;
    try {
        // Verify ownership via JOIN before deleting
        const deleteQuery = `
            DELETE t FROM transactions t
            JOIN crops c ON t.crop_id = c.id
            WHERE t.id = ? AND c.user_id = ?
        `;
        
        const [result] = await db.query(deleteQuery, [txId, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Transaction not found or access denied." });
        }

        res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

module.exports = router;