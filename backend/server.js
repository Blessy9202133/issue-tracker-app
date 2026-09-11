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
          name: 'HBL Admin',
          email: 'admin@hbl.com',
          username: 'hbladmin',
          phoneNumber: '9876543200',
          department: 'HBL Admin',
          password: 'password123',
          role: 'ADMIN',
        },
        {
          name: 'Sushma',
          email: 'abc@hbl.com',
          username: 'sushma',
          phoneNumber: '9876543210',
          department: 'Customer Desk',
          password: 'password123',
          role: 'REPORTER',
        },
        {
          name: 'jahnavi',
          email: 'xyz@hbl.com',
          username: 'jahnavi',
          phoneNumber: '9876543211',
          department: 'Software Department',
          password: 'password123',
          role: 'ASSIGNEE',
        },
        {
          name: 'prabhakar',
          email: 'prabhakar@hbl.com',
          username: 'prabhakar',
          phoneNumber: '9876543212',
          department: 'Hardware Department',
          password: 'password123',
          role: 'ASSIGNEE',
        },
      ]);
      console.log('HBL Portal users seeded:');
      console.log(' - HBL Admin (admin@hbl.com / hbladmin) - ADMIN');
      console.log(' - Sushma (abc@hbl.com / sushma) - REPORTER');
      console.log(' - jahnavi (xyz@hbl.com / jahnavi) - ASSIGNEE (Software)');
      console.log(' - prabhakar (prabhakar@hbl.com / prabhakar) - ASSIGNEE (Hardware)');
    }
  } catch (err) {
    console.error('Error seeding users:', err.message);
  }
};

seedUsers();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Customer Complaint Portal API running on port ${PORT}`);
});
