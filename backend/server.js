const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const issueRoutes = require('./src/routes/issueRoutes');
const User = require('./src/models/User');

dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Issue Tracker API is running smoothly' });
});

// Seed default users if empty (for instant testing)
const seedUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial demo users...');
      await User.create([
        {
          name: 'Manager User',
          email: 'manager@issuetracker.com',
          username: 'manager',
          phoneNumber: '9876543210',
          password: 'password123',
          role: 'REPORTER',
        },
        {
          name: 'John Technician',
          email: 'john.tech@issuetracker.com',
          username: 'johntech',
          phoneNumber: '9876543211',
          password: 'password123',
          role: 'ASSIGNEE',
        },
        {
          name: 'Sarah Engineer',
          email: 'sarah.eng@issuetracker.com',
          username: 'saraheng',
          phoneNumber: '9876543212',
          password: 'password123',
          role: 'ASSIGNEE',
        },
      ]);
      console.log('Demo users created successfully:');
      console.log(' - Username: manager / password123 (REPORTER)');
      console.log(' - Username: johntech / password123 (ASSIGNEE)');
      console.log(' - Username: saraheng / password123 (ASSIGNEE)');
    }
  } catch (err) {
    console.error('Error seeding users:', err.message);
  }
};

seedUsers();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
