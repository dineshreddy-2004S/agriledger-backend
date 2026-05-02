const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: { 
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2' 
    }, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Immediate connection test for logs
db.getConnection()
    .then(connection => {
        console.log("✅ TiDB Cloud Connection Successful!");
        connection.release();
    })
    .catch(err => {
        console.error("❌ TiDB Cloud Connection Failed:", err.message);
    });

module.exports = db;