const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const getmac = require('getmac');
const db = require('./database');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Sample route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Friends API

app.get('/api/friends', (req, res) => {
    const { username } = req.query;
    if (username) {
        db.all('SELECT friend FROM friends WHERE username = ?', [username], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error fetching friends' });
            } else {
                res.json(rows.map(row => row.friend));
            }
        });
    } else {
        res.status(400).json({ message: 'Username is required' });
    }
});



app.delete('/api/friends/:username/:friend', (req, res) => {
    const { username, friend } = req.params;
    db.run('DELETE FROM friends WHERE username = ? AND friend = ?', [username, friend], err => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error removing friend' });
        } else {
            res.json({ message: 'Friend removed successfully' });
        }
    });
});

app.get('/api/friend-requests', (req, res) => {
    const { username } = req.query;
    if (username) {
        db.all('SELECT requester FROM friend_requests WHERE username = ?', [username], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error fetching friend requests' });
            } else {
                res.json(rows.map(row => row.requester));
            }
        });
    } else {
        res.status(400).json({ message: 'Username is required' });
    }
});


app.post('/api/friend-requests', (req, res) => {
    const { username, requester } = req.body;
    if (username && requester) {
        // Check if they are already friends
        db.get(
            `SELECT * FROM friends 
             WHERE (username = ? AND friend = ?) OR (username = ? AND friend = ?)`,
            [username, requester, requester, username],
            (err, row) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ message: 'Error checking friendship status' });
                } else if (row) {
                    res.status(400).json({ message: 'You are already friends' });
                } else {
                    // Check if a friend request already exists in either direction
                    db.get(
                        `SELECT * FROM friend_requests 
                         WHERE (username = ? AND requester = ?) OR (username = ? AND requester = ?)`,
                        [username, requester, requester, username],
                        (err, row) => {
                            if (err) {
                                console.error(err);
                                res.status(500).json({ message: 'Error checking for duplicate friend requests' });
                            } else if (row) {
                                res.status(400).json({ message: 'Friend request already exists' });
                            } else {
                                // Insert the new friend request
                                db.run('INSERT INTO friend_requests (username, requester) VALUES (?, ?)', [username, requester], err => {
                                    if (err) {
                                        console.error(err);
                                        res.status(500).json({ message: 'Error sending friend request' });
                                    } else {
                                        res.status(201).json({ message: 'Friend request sent successfully' });
                                    }
                                });
                            }
                        }
                    );
                }
            }
        );
    } else {
        res.status(400).json({ message: 'Username and requester are required' });
    }
});



app.post('/api/friend-requests/accept', (req, res) => {
    const { username, requester } = req.body;
    if (username && requester) {
        db.run('DELETE FROM friend_requests WHERE username = ? AND requester = ?', [username, requester], err => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error accepting friend request' });
            } else {
                db.run('INSERT INTO friends (username, friend) VALUES (?, ?)', [username, requester], err => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({ message: 'Error adding friend' });
                    } else {
                        res.json({ message: 'Friend request accepted' });
                    }
                });
            }
        });
    } else {
        res.status(400).json({ message: 'Username and requester are required' });
    }
});

app.post('/api/friend-requests/decline', (req, res) => {
    const { username, requester } = req.body;
    if (username && requester) {
        db.run('DELETE FROM friend_requests WHERE username = ? AND requester = ?', [username, requester], err => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error declining friend request' });
            } else {
                res.json({ message: 'Friend request declined' });
            }
        });
    } else {
        res.status(400).json({ message: 'Username and requester are required' });
    }
});

// Minecraft Account API
app.get('/api/minecraft-accounts', (req, res) => {
    db.all('SELECT username, token FROM minecraft_accounts', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching Minecraft accounts' });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/minecraft-accounts', (req, res) => {
    const { username, token } = req.body;
    if (username && token) {
        db.run('INSERT INTO minecraft_accounts (username, token) VALUES (?, ?)', [username, token], err => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error adding Minecraft account' });
            } else {
                res.status(201).json({ message: 'Minecraft account added successfully' });
            }
        });
    } else {
        res.status(400).json({ message: 'Username and token are required' });
    }
});

app.delete('/api/minecraft-accounts/:username', (req, res) => {
    const { username } = req.params;
    db.run('DELETE FROM minecraft_accounts WHERE username = ?', [username], err => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error removing Minecraft account' });
        } else {
            res.json({ message: 'Minecraft account removed successfully' });
        }
    });
});

// User Online/Offline API


app.post('/api/user-online', (req, res) => {
    const { username } = req.body;
    if (username) {
        const hwid = getmac.default();

        db.run('INSERT OR IGNORE INTO users (username, hwid) VALUES (?, ?)', [username, hwid], err => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error marking user as online' });
            } else {
                res.status(201).json({ message: 'User marked as online', hwid: hwid });
            }
        });
    } else {
        res.status(400).json({ message: 'Username is required' });
    }
});



app.post('/api/user-offline', (req, res) => {
    const { username } = req.body;
    if (username) {
        db.run('DELETE FROM users WHERE username = ?', [username], err => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error marking user as offline' });
            } else {
                res.status(201).json({ message: 'User marked as offline' });
            }
        });
    } else {
        res.status(400).json({ message: 'Username is required' });
    }
});

app.get('/api/user/avatar', async (req, res) => {
    const { username } = req.query;
    if (username) {
        try {
            const avatarUrl = `https://minotar.net/avatar/${username}/32`;
            const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });

            if (response.status === 200) {
                res.status(200).set('Content-Type', 'image/png').send(response.data);
            } else {
                res.status(404).json({ message: 'Avatar not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching avatar' });
        }
    } else {
        res.status(400).json({ message: 'Username is required' });
    }
});

// Get total number of online users
app.get('/api/online-users', (req, res) => {
    db.all('SELECT username, hwid FROM users', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching online users' });
        } else {
            res.json({ count: rows.length, users: rows });
        }
    });
});

// Route to get version manifest JSON
app.get('/api/version-manifest', async (req, res) => {
    try {
        const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');
        res.status(200).json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching version manifest' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
