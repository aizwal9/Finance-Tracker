const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
});

const User = mongoose.model('User', userSchema);

// Define Transaction Schema
const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: Date,
    description: String,
    amount: Number,
    category: String,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get user profile
app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Add a new transaction
app.post('/api/transactions', verifyToken, async (req, res) => {
    try {
        const { date, description, amount, category } = req.body;
        const transaction = new Transaction({
            userId: req.userId,
            date,
            description,
            amount,
            category,
        });
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Get all transactions for a user
app.get('/api/transactions', verifyToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get('/api/transactions', verifyToken, async (req, res) => {
    try {
        const { timeRange } = req.query
        let startDate = new Date()

        switch (timeRange) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7)
                break
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1)
                break
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1)
                break
            default:
                startDate.setMonth(startDate.getMonth() - 1) // Default to last month
        }

        const transactions = await Transaction.find({
            userId: req.userId,
            date: { $gte: startDate }
        }).sort({ date: -1 })

        res.json(transactions)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' })
    }
})

// Update the route to add a new transaction
app.post('/api/transactions', verifyToken, async (req, res) => {
    try {
        const { date, description, amount, category } = req.body
        const transaction = new Transaction({
            userId: req.userId,
            date,
            description,
            amount: parseFloat(amount),
            category,
        })
        await transaction.save()
        res.status(201).json(transaction)
    } catch (error) {
        res.status(500).json({ error: 'Failed to add transaction' })
    }
})