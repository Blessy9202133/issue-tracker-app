const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const User = require('../models/User');
const { sendIssueAssignmentEmail } = require('../config/mailer');

// @desc    Create a new customer complaint
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res) => {
  try {
    const {
      complaintCategory,
      zone,
      contract,
      station,
      complaintType,
      shed,
      locoNumber,
      locoType,
      brakeType,
      failureType,
      poLoaNumber,
      details,
      issueRaisedDate,
      assignedTo,
    } = req.body;

    if (!zone || !details) {
      return res.status(400).json({ message: 'Zone and Complaint description are required' });
    }

    // Default to HBL Admin if assignedTo is not specified
    let targetAssigneeId = assignedTo;
    if (!targetAssigneeId) {
      const adminUser = await User.findOne({ $or: [{ role: 'ADMIN' }, { email: 'admin@hbl.com' }] }).select('_id');
      if (adminUser) {
        targetAssigneeId = adminUser._id;
      } else {
        const anyUser = await User.findOne().select('_id');
        targetAssigneeId = anyUser ? anyUser._id : req.user._id;
      }
    }

    // Process uploaded photo paths
    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const issueData = {
      complaintCategory: complaintCategory || 'WAYSIDE',
      zone,
      contract,
      station,
      complaintType,
      shed,
      locoNumber,
      locoType,
      brakeType,
      failureType,
      poLoaNumber,
      details,
      issueRaisedDate: issueRaisedDate || Date.now(),
      photos,
      assignedTo: targetAssigneeId,
      createdBy: req.user._id,
      status: 'OPEN',
    };

    const issue = await Issue.create(issueData);

    const populatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email department')
      .populate('assignedTo', 'name email department');

    // Trigger non-blocking background email
    if (populatedIssue.assignedTo && populatedIssue.assignedTo.email) {
      sendIssueAssignmentEmail(populatedIssue, populatedIssue.assignedTo);
    }

    res.status(201).json(populatedIssue);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all complaints (fast query)
// @route   GET /api/issues
// @access  Private
const getIssues = async (req, res) => {
  try {
    const { status, zone, shed, complaintCategory, assignedToMe } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (complaintCategory) {
      query.complaintCategory = complaintCategory;
    }
    if (zone) {
      query.zone = { $regex: zone, $options: 'i' };
    }
    if (shed) {
      query.shed = { $regex: shed, $options: 'i' };
    }
    if (assignedToMe === 'true') {
      query.assignedTo = req.user._id;
    }

    const issues = await Issue.find(query)
      .populate('createdBy', 'name email department')
      .populate('assignedTo', 'name email department')
      .populate('comments.user', 'name email department')
      .sort({ createdAt: -1 })
      .lean();

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single complaint by Mongo _id OR issueCode (fast query)
// @route   GET /api/issues/:id
// @access  Private
const getIssueById = async (req, res) => {
  try {
    const paramId = req.params.id;
    let query = {};

    if (mongoose.Types.ObjectId.isValid(paramId)) {
      query._id = paramId;
    } else {
      query.issueCode = paramId.toUpperCase();
    }

    const issue = await Issue.findOne(query)
      .populate('createdBy', 'name email department')
      .populate('assignedTo', 'name email department')
      .populate('comments.user', 'name email role department')
      .lean();

    if (!issue) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(issue);
  } catch (error) {
    console.error('Error in getIssueById:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to complaint & allocate/reassign
// @route   PUT /api/issues/:id/respond
// @access  Private
const respondToIssue = async (req, res) => {
  try {
    const { comment, targetDate, status, expectedCompletionDate, reassignTo } = req.body;

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    let reassigned = false;
    let newAssigneeUser = null;

    if (reassignTo && reassignTo.toString() !== issue.assignedTo.toString()) {
      issue.assignedTo = reassignTo;
      reassigned = true;
      newAssigneeUser = await User.findById(reassignTo);
    }

    if (status) {
      issue.status = status;
    }

    if (expectedCompletionDate) {
      issue.expectedCompletionDate = expectedCompletionDate;
    }

    if (comment || reassigned) {
      const commentText = comment
        ? (reassigned ? `[Re-assigned to ${newAssigneeUser?.name} (${newAssigneeUser?.department})] - ${comment}` : comment)
        : `Re-assigned complaint to ${newAssigneeUser?.name} (${newAssigneeUser?.department})`;

      issue.comments.push({
        user: req.user._id,
        comment: commentText,
        targetDate: targetDate || expectedCompletionDate,
      });
    }

    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email department')
      .populate('assignedTo', 'name email department')
      .populate('comments.user', 'name email role department');

    if (reassigned && newAssigneeUser && newAssigneeUser.email) {
      sendIssueAssignmentEmail(updatedIssue, newAssigneeUser);
    }

    res.json(updatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  respondToIssue,
};
