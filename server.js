const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios')
const app = express();
const port = 3000;

let friends = [];
let friendRequests = [];
let minecraftAccounts = [];
let onlineUsers = [];

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
    res.json(friends);
});

app.post('/api/friends', (req, res) => {
    const { username } = req.body;
    if (username) {
        friends.push({ username });
        res.status(201).json({ message: 'Friend added successfully' });
    } else {
        res.status(400).json({ message: 'Username is required' });
    }
});

app.delete('/api/friends/:username', (req, res) => {
    const { username } = req.params;
    friends = friends.filter(friend => friend.username !== username);
    res.json({ message: 'Friend removed successfully' });
});

app.get('/api/friend-requests', (req, res) => {
    res.json(friendRequests);
});

app.post('/api/friend-requests/accept', (req, res) => {
    const { username } = req.body;
    if (username) {
        friendRequests = friendRequests.filter(request => request.username !== username);
        friends.push({ username });
        res.json({ message: 'Friend request accepted' });
    } else {
        res.status(400).json({ message: 'Username is required' });
    }
});

app.post('/api/friend-requests/decline', (req, res) => {
    const { username } = req.body;
    if (username) {
        friendRequests = friendRequests.filter(request => request.username !== username);
        res.json({ message: 'Friend request declined' });
    } else {
        res.status(400).json({ message: 'Username is required' });
    }
});

// Minecraft Account API
app.get('/api/minecraft-accounts', (req, res) => {
    res.json(minecraftAccounts);
});

app.post('/api/minecraft-accounts', (req, res) => {
    const { username, token } = req.body;
    if (username && token) {
        minecraftAccounts.push({ username, token });
        res.status(201).json({ message: 'Minecraft account added successfully' });
    } else {
        res.status(400).json({ message: 'Username and token are required' });
    }
});

app.delete('/api/minecraft-accounts/:username', (req, res) => {
    const { username } = req.params;
    minecraftAccounts = minecraftAccounts.filter(account => account.username !== username);
    res.json({ message: 'Minecraft account removed successfully' });
});

// User Online/Offline API
app.post('/api/user-online', (req, res) => {
    const { username } = req.body;
    if (username && !onlineUsers.includes(username)) {
        onlineUsers.push(username);
        res.status(201).json({ message: 'User marked as online' });
    } else {
        res.status(400).json({ message: 'Username is required or already online' });
    }
});

app.post('/api/user-offline', (req, res) => {
    const { username } = req.body;
    if (username && onlineUsers.includes(username)) {
        onlineUsers = onlineUsers.filter(user => user !== username);
        res.status(201).json({ message: 'User marked as offline' });
    } else {
        res.status(400).json({ message: 'Username is required or not online' });
    }
});

app.get('/api/user/avatar', async (req, res) => {
    const { username } = req.query;
    if (username) {
        try {
            const avatarUrl = `https://minotar.net/avatar/${username}/32`;
            const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });

            if (response.status === 200) {
                // Send the avatar image data back as a response
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
    res.json({ count: onlineUsers.length, users: onlineUsers });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
