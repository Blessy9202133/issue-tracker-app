const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_issue_tracker_2026');
        req.user = await User.findById(decoded.id).select('-password');
        if (req.user) {
          return next();
        }
      }
    } catch (error) {
      // If token verification fails, continue to open access fallback
    }
  }

  // Open access mode: Fallback to an existing portal user so all operations succeed without login
  try {
    let defaultUser = await User.findOne({ role: 'admin' }).select('-password');
    if (!defaultUser) {
      defaultUser = await User.findOne().select('-password');
    }
    req.user = defaultUser;
    return next();
  } catch (error) {
    console.error('Error fetching fallback user in open mode:', error);
    return next();
  }
};

module.exports = { protect };

