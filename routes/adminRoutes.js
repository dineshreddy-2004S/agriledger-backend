const express = require('express');
const db = require('../config/db');
const { authenticateToken, authenticateAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all users
router.get('/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role, is_approved, created_at FROM users WHERE role = "farmer"');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Update user access status
router.put('/users/:id/access', authenticateToken, authenticateAdmin, async (req, res) => {
    const { is_approved } = req.body;
    const userId = req.params.id;
    try {
        await db.query('UPDATE users SET is_approved = ? WHERE id = ?', [is_approved, userId]);
        res.json({ message: `User access updated to ${is_approved ? 'Approved' : 'Revoked'}` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update user access" });
    }
});

// Delete user
router.delete('/users/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    const userId = req.params.id;
    try {
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: "User successfully deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

module.exports = router;