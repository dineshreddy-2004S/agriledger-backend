const jwt = require('jsonwebtoken');
require('dotenv').config();

// Standardize the secret key to ensure it matches what was used to sign the token
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_farm_key_123';

/**
 * Verifies the JWT token sent in the Authorization header.
 * Usage: router.get('/path', authenticateToken, (req, res) => { ... })
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Format: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: "Access Denied: No token provided." });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            console.error("JWT Verification Error:", err.message);
            return res.status(403).json({ error: "Access Denied: Invalid or expired token." });
        }
        
        // Attach the decoded user data (id, name, role) to the request object
        req.user = decodedUser;
        next();
    });
};

/**
 * Checks if the authenticated user has the 'admin' role.
 * MUST be used after authenticateToken.
 * Usage: router.get('/admin-only', authenticateToken, authenticateAdmin, (req, res) => { ... })
 */
const authenticateAdmin = (req, res, next) => {
    // Safety check: ensure authenticateToken was called first
    if (!req.user) {
        return res.status(500).json({ error: "Internal Error: Auth middleware sequence incorrect." });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access Denied: Admin privileges required." });
    }
    
    next();
};

// We export an object containing both functions
module.exports = { 
    authenticateToken, 
    authenticateAdmin 
};