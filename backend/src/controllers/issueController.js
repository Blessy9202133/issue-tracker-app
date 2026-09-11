const Issue = require('../models/Issue');
const User = require('../models/User');
const { sendIssueAssignmentEmail } = require('../config/mailer');

// @desc    Create a new customer complaint (Wayside or Onboard template)
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

    if (!zone || !details || !assignedTo) {
      return res.status(400).json({ message: 'Zone, Complaint description, and Assignee are required' });
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
      assignedTo,
      createdBy: req.user._id,
      status: 'OPEN',
    };

    const issue = await Issue.create(issueData);

    const populatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    // Send email notification asynchronously
    if (populatedIssue.assignedTo && populatedIssue.assignedTo.email) {
      sendIssueAssignmentEmail(populatedIssue, populatedIssue.assignedTo);
    }

    res.status(201).json(populatedIssue);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all complaints (with filtering)
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
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single complaint by ID
// @route   GET /api/issues/:id
// @access  Private
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email role');

    if (!issue) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to complaint
// @route   PUT /api/issues/:id/respond
// @access  Private
const respondToIssue = async (req, res) => {
  try {
    const { comment, targetDate, status, expectedCompletionDate } = req.body;

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (status) {
      issue.status = status;
    }

    if (expectedCompletionDate) {
      issue.expectedCompletionDate = expectedCompletionDate;
    }

    if (comment) {
      issue.comments.push({
        user: req.user._id,
        comment,
        targetDate: targetDate || expectedCompletionDate,
      });
    }

    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email role');

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
