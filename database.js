const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Define the path for the file-based database
const dbPath = path.join(__dirname, 'database.sqlite');

// Function to initialize the database
function initializeDatabase(db) {
    db.serialize(() => {
        // Create tables
        db.run(`CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            hwid TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            friend TEXT,
            FOREIGN KEY (username) REFERENCES users(username),
            FOREIGN KEY (friend) REFERENCES users(username)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            requester TEXT,
            FOREIGN KEY (username) REFERENCES users(username),
            FOREIGN KEY (requester) REFERENCES users(username)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS minecraft_accounts (
            username TEXT PRIMARY KEY,
            token TEXT,
            FOREIGN KEY (username) REFERENCES users(username)
        )`);
    });
}

// Check if the file-based database exists and is not corrupted
function isDatabaseCorrupted(dbFilePath) {
    try {
        // Attempt to open the database file
        if (fs.existsSync(dbFilePath)) {
            const tempDb = new sqlite3.Database(dbFilePath);
            tempDb.close();
            return false;
        }
    } catch (error) {
        console.error('Database file is corrupted or inaccessible:', error);
        return true;
    }
    return false;
}

let db;
if (isDatabaseCorrupted(dbPath)) {
    console.log('Using in-memory database due to corruption or inaccessibility of the file-based database');
    db = new sqlite3.Database(':memory:');
} else {
    console.log('Using file-based database');
    db = new sqlite3.Database(dbPath);
}

// Initialize the database
initializeDatabase(db);

module.exports = db;
