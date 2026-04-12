const mysql = require('mysql2/promise'); // The '/promise' here is CRITICAL

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

// Test the connection immediately so it shows in Render Logs
db.getConnection()
    .then(connection => {
        console.log("✅ Successfully connected to TiDB Database!");
        connection.release();
    })
    .catch(err => {
        console.error("❌ Database Connection Failed:", err);
    });

module.exports = db;