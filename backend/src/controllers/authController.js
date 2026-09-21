const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ForgotPassword = require('../models/ForgotPassword');
const { sendForgotPasswordEmail } = require('../utils/EmailUtil');

const JWT_SECRET = process.env.JWT_SECRET || 'KavachComplaintPortalSecretKey2026';

// Helper to generate JWT Token
const generateToken = (id, username, role) => {
  return jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new user account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    if (!name?.trim() || !username?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'Name, Username, Email, and Password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
      }
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: role && ['Admin', 'Manager', 'User'].includes(role) ? role : 'User',
    });

    const token = generateToken(user._id, user.username, user.role);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      message: 'Account created successfully!',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration.' });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'Username and Password are required.' });
    }

    const cleanInput = username.trim().toLowerCase();

    // Find user by username OR email
    const user = await User.findOne({
      $or: [{ username: cleanInput }, { email: cleanInput }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact Admin.' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = generateToken(user._id, user.username, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      message: 'Login successful!',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login.' });
  }
};

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username?.trim()) {
      return res.status(400).json({ message: 'Username or Email is required.' });
    }

    const cleanInput = username.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ username: cleanInput }, { email: cleanInput }],
    });

    if (!user) {
      return res.status(404).json({ message: 'No user account found with that username or email.' });
    }

    const hash = crypto.randomBytes(32).toString('hex');
    const expiresBy = Date.now() + 30 * 60 * 1000; // 30 minutes

    await ForgotPassword.create({
      hash,
      userId: user._id,
      expiresBy,
    });

    const emailResult = await sendForgotPasswordEmail(user.name, user.email, hash);

    res.json({
      message: 'Password reset link has been generated.',
      resetLink: emailResult.resetLink,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message || 'Server error during forgot password.' });
  }
};

// @desc    Reset password using valid token/hash
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { hash, password } = req.body;
    if (!hash?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    const record = await ForgotPassword.findOne({ hash: hash.trim() });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired password reset link.' });
    }

    if (record.isUsed) {
      return res.status(400).json({ message: 'This password reset link has already been used.' });
    }

    if (record.expiresBy < Date.now()) {
      return res.status(400).json({ message: 'This password reset link has expired. Please request a new one.' });
    }

    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(404).json({ message: 'Associated user account not found.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Mark reset record as used
    record.isUsed = true;
    await record.save();

    res.json({ message: 'Password has been updated successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Server error during password reset.' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No auth token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// @desc    Pre-seed default admin user if database has no users
const seedAdmin = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin#2026', salt);
      await User.create({
        name: 'System Administrator',
        username: 'admin',
        email: 'admin@hbl.in',
        password: hashedPassword,
        role: 'Admin',
      });
      console.log('Default admin account pre-seeded: username=admin, password=Admin#2026');
    }
  } catch (e) {
    console.warn('Could not seed admin user:', e.message);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  seedAdmin,
};
