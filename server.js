const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet');

dotenv.config();
const app = express();
const PORT = 3000;

// Helper function to read users from 'user.json'
function readUsersFromFile() {
    try {
        const usersData = fs.readFileSync('user.json', 'utf-8');
        return JSON.parse(usersData);
    } catch (err) {
        console.error('Error reading user.json:', err);
        return [];
    }
}

// Helper function to write users to 'user.json'
function writeUsersToFile(users) {
    try {
        fs.writeFileSync('user.json', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error writing to user.json:', err);
    }
}

// Middleware
app.use(helmet()); // Add security headers
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'views'))); // Serve static files
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Middleware: check if logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/');
}

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Serve register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/login', (req, res) => { 
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});


// Handle registration
app.post('/register', (req, res) => {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.send('❌ Passwords do not match. <a href="/register">Try again</a>');
    }

    const users = readUsersFromFile();

    // Check if user already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.send('❌ User already exists. <a href="/register">Try again</a>');
    }

    // Hash the password

    // Create new user
    const newUser = { username, password, role: 'user' }; // Default role as 'user'
    users.push(newUser);

    writeUsersToFile(users);

    // Log in the user immediately after registration
    req.session.user = newUser;
    res.redirect('/dashboard');
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const users = readUsersFromFile();

    // Find user by username
    const foundUser = users.find(user => user.username === username);
    if (foundUser && foundUser.password === password) { 
        // Store user details in the session
        req.session.user = {
            username: foundUser.username,
            role: foundUser.role
        };

        // Set a cookie to indicate if the user is an admin
        const isAdmin = foundUser.role === 'admin';
        res.cookie('Admin', isAdmin, { httpOnly: true, secure: false });
        res.cookie('session', req.sessionID, { httpOnly: true, secure: false });
        // Redirect to the profile page
        return res.redirect('/profile');
    } else {
        // Send an error response for invalid credentials
        return res.status(401).send('❌ Invalid credentials. <a href="/">Try again</a>');
    }
});
// Dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
    const { username, role } = req.session.user; // Access the role from the session
    res.send(`
        <h2>Welcome ${username}!</h2>
        <p>Role: ${role}</p>
        <a href="/profile">👤 Profile</a><br />
        ${role === 'admin' ? '<a href="/admin">🛠️ Admin Dashboard</a><br />' : ''}
        <a href="/logout">🚪 Logout</a>
    `);
});

// Profile (shared for all)
app.get('/profile', isAuthenticated, (req, res) => {
    const { username, role } = req.session.user;
    let extraInfo = role === 'admin' 
        ? `<p>🛠️ Access Level: Super Admin</p>`
        : `<p>⭐ Membership: Free Tier</p>`;

    res.send(`
        <h2>👤 Profile Page</h2>
        <p>Username: ${username}</p>
        <p>Role: ${role}</p>
        ${extraInfo}
        <a href="/dashboard">← Back to Dashboard</a>
    `);
});

// Admin Dashboard
app.get('/admin', isAuthenticated, (req, res) => {
    if (req.session.user?.role !== 'admin') {
        return res.status(403).send('⛔ Admins only.');
    }
    res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('❌ Error logging out.');
        }
        res.redirect('/');
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Ensure user.json file exists with an empty array if not present
if (!fs.existsSync('user.json')) {
    fs.writeFileSync('user.json', JSON.stringify([]));
}

// Ensure views directory exists
if (!fs.existsSync(path.join(__dirname, 'views'))) {
    fs.mkdirSync(path.join(__dirname, 'views'));
}

// Ensure login.html and register.html files exist
if (!fs.existsSync(path.join(__dirname, 'views', 'login.html'))) {
    fs.writeFileSync(path.join(__dirname, 'views', 'login.html'), `
        <h2>Login</h2>
        <form action="/login" method="POST">
            <input type="text" name="username" placeholder="Username" required /><br />
            <input type="password" name="password" placeholder="Password" required /><br />
            <button type="submit">Login</button>
        </form>
        <a href="/register">Register</a>
    `);
}
if (!fs.existsSync(path.join(__dirname, 'views', 'register.html'))) {
    fs.writeFileSync(path.join(__dirname, 'views', 'register.html'), `
        <h2>Register</h2>
        <form action="/register" method="POST">
            <input type="text" name="username" placeholder="Username" required /><br />
            <input type="password" name="password" placeholder="Password" required /><br />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" required /><br />
            <button type="submit">Register</button>
        </form>
        <a href="/">Login</a>
    `);
}
if (!fs.existsSync(path.join(__dirname, 'views', 'admin-dashboard.html'))) {
    fs.writeFileSync(path.join(__dirname, 'views', 'admin-dashboard.html'), `
        <h2>Admin Dashboard</h2>
        <p>Welcome to the admin dashboard!</p>
        <a href="/dashboard">← Back to Dashboard</a>
    `);
}

// Ensure session secret is set in .env file
if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', 'SESSION_SECRET=your_secret_key');
}