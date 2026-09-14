const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // Open access mode: No user DB dependency required
  req.user = null;
  return next();
};

module.exports = { protect };

