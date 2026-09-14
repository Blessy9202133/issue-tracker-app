const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const { initBackupScheduler } = require('./src/utils/backupScheduler');
const issueRoutes = require('./src/routes/issueRoutes');

dotenv.config();

// Connect Database
connectDB();

// Initialize Automatic Daily MongoDB Backup Scheduler
initBackupScheduler();

const app = express();

// Middlewares - Allow CORS from localhost & 127.0.0.1
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/issues', issueRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Customer Complaint Portal API is running smoothly' });
});

const PORT = process.env.PORT || 5000;

// Explicitly listen on 0.0.0.0 to support both IPv4 and IPv6 instant connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Customer Complaint Portal API running on http://127.0.0.1:${PORT}`);
});
