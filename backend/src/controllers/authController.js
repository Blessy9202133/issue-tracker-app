const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_issue_tracker_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, username, phoneNumber, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const searchConditions = [{ email: email.toLowerCase() }];
    if (username) {
      searchConditions.push({ username: username.toLowerCase() });
    }

    const userExists = await User.findOne({ $or: searchConditions });

    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const user = await User.create({
      name,
      email,
      username: username ? username.toLowerCase() : email.split('@')[0],
      phoneNumber: phoneNumber || '',
      password,
      role: role || 'Customer',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user using Username OR Email & Password
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username/Email and password are required' });
    }

    const searchStr = username.trim().toLowerCase();

    // Match by email OR username OR name
    const user = await User.findOne({
      $or: [
        { email: searchStr },
        { username: searchStr },
        { name: new RegExp(`^${searchStr}$`, 'i') },
      ],
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        phoneNumber: user.phoneNumber || '',
        department: user.department || '',
        role: user.role || 'Customer',
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username/email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (for Assignee dropdown)
// @route   GET /api/auth/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUsers,
};
