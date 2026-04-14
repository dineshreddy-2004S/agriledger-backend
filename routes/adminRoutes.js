const express = require('express');
const db = require('../config/db');
const { authenticateToken, authenticateAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Fetch all users with the role 'farmer'
 * @access  Private (Admin Only)
 */
router.get('/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, role, is_approved, created_at FROM users WHERE role = "farmer"'
        );
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

/**
 * @route   PUT /api/admin/users/:id/access
 * @desc    Approve or Revoke a farmer's access
 * @access  Private (Admin Only)
 */
router.put('/users/:id/access', authenticateToken, authenticateAdmin, async (req, res) => {
    const { is_approved } = req.body;
    const userId = req.params.id;
    try {
        await db.query('UPDATE users SET is_approved = ? WHERE id = ?', [is_approved, userId]);
        res.json({ message: `User access updated to ${is_approved ? 'Approved' : 'Revoked'}` });
    } catch (error) {
        console.error("Error updating access:", error);
        res.status(500).json({ error: "Failed to update user access" });
    }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Permanently delete a user and all associated data
 * @access  Private (Admin Only)
 */
router.delete('/users/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    const userId = req.params.id;
    try {
        // Note: If your DB schema has ON DELETE CASCADE for foreign keys, 
        // deleting the user will automatically delete their crops and transactions.
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: "User and all associated data successfully deleted" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

module.exports = router;