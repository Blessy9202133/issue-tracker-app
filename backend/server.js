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

// Middlewares - Allow CORS from localhost & 127.0.0.1
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
  res.json({ status: 'OK', message: 'Customer Complaint Portal API is running smoothly' });
});

// Seed default users if empty
const seedUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial HBL Portal users...');
      await User.create([
        {
          name: 'Sushma',
          email: 'sushma.onapakala@hbl.com',
          username: 'sushma',
          phoneNumber: '9876543210',
          department: 'Customer Desk',
          password: 'password123',
          role: 'Customer',
        },
        {
          name: 'jahnavi',
          email: 'sushmaonapakala@hbl.com',
          username: 'jahnavi',
          phoneNumber: '9876543211',
          department: 'HBL Software Dept',
          password: 'password123',
          role: 'hbl_emp',
        },
        {
          name: 'prabhakar',
          email: 'admin@hbl.com',
          username: 'prabhakar',
          phoneNumber: '9876543212',
          department: 'HBL Management',
          password: 'password123',
          role: 'admin',
        },
      ]);
      console.log('HBL Portal users seeded:');
      console.log(' - Sushma (Customer)');
      console.log(' - jahnavi (hbl_emp)');
      console.log(' - prabhakar (admin)');
    }
  } catch (err) {
    console.error('Error seeding users:', err.message);
  }
};

seedUsers();

const PORT = process.env.PORT || 5000;

// Explicitly listen on 0.0.0.0 to support both IPv4 and IPv6 instant connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Customer Complaint Portal API running on http://127.0.0.1:${PORT}`);
});
