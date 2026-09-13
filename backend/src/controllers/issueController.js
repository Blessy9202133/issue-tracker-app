const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const User = require('../models/User');
const { sendIssueAssignmentEmail } = require('../config/mailer');

const getEffectiveUser = async (req) => {
  if (req.user && req.user._id) return req.user;
  let user = await User.findOne({ role: 'admin' });
  if (!user) user = await User.findOne();
  return user;
};


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

    const effectiveUser = await getEffectiveUser(req);
    const targetAssigneeId = assignedTo || effectiveUser?._id;

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
      createdBy: effectiveUser?._id,
      status: 'OPEN',
    };

    const issue = await Issue.create(issueData);

    const populatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email department role')
      .populate('assignedTo', 'name email department role');

    if (populatedIssue.assignedTo && populatedIssue.assignedTo.email) {
      sendIssueAssignmentEmail(populatedIssue, populatedIssue.assignedTo);
    }

    res.status(201).json(populatedIssue);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all complaints
// @route   GET /api/issues
// @access  Private
const getIssues = async (req, res) => {
  try {
    const { status, zone, shed, complaintCategory, assignedToMe, complaintType } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (complaintType) {
      query.complaintType = complaintType;
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
    if (assignedToMe === 'true' && req.user && req.user._id) {
      query.assignedTo = req.user._id;
    }

    const issues = await Issue.find(query)
      .populate('createdBy', 'name email department role')
      .populate('assignedTo', 'name email department role')
      .populate('comments.user', 'name email department role')
      .sort({ createdAt: -1 })
      .lean();

    const formattedIssues = issues.map((issue) => {
      if (issue.status === 'CLOSED' && !issue.closedDate) {
        issue.closedDate = issue.updatedAt || issue.createdAt;
      }
      return issue;
    });

    res.json(formattedIssues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single complaint by Mongo _id OR issueCode
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
      .populate('createdBy', 'name email department role')
      .populate('assignedTo', 'name email department role')
      .populate('comments.user', 'name email role department')
      .lean();

    if (!issue) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (issue.status === 'CLOSED' && !issue.closedDate) {
      issue.closedDate = issue.updatedAt || issue.createdAt;
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
    const { comment, targetDate, status, expectedCompletionDate, reassignTo, analysis, actionTaken, complaintType } = req.body;

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (analysis !== undefined) {
      issue.analysis = analysis;
    }
    if (actionTaken !== undefined) {
      issue.actionTaken = actionTaken;
    }
    if (complaintType !== undefined) {
      issue.complaintType = complaintType;
    }

    // Handle analysis team uploaded files and photos
    let updatedAnalysisPhotos = issue.analysisPhotos || [];
    if (req.body.existingAnalysisPhotos !== undefined) {
      try {
        updatedAnalysisPhotos = typeof req.body.existingAnalysisPhotos === 'string'
          ? JSON.parse(req.body.existingAnalysisPhotos)
          : req.body.existingAnalysisPhotos;
      } catch (e) {
        updatedAnalysisPhotos = Array.isArray(req.body.existingAnalysisPhotos)
          ? req.body.existingAnalysisPhotos
          : [req.body.existingAnalysisPhotos];
      }
    }

    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((file) => `/uploads/${file.filename}`);
      updatedAnalysisPhotos = updatedAnalysisPhotos.concat(newFiles);
    }
    issue.analysisPhotos = updatedAnalysisPhotos;

    let reassigned = false;
    let newAssigneeUser = null;

    if (reassignTo && reassignTo.toString() !== issue.assignedTo.toString()) {
      issue.assignedTo = reassignTo;
      reassigned = true;
      newAssigneeUser = await User.findById(reassignTo);
    }

    if (status) {
      issue.status = status;
      if (status === 'CLOSED') {
        issue.closedDate = issue.closedDate || new Date();
      } else {
        issue.closedDate = null;
      }
    }

    if (expectedCompletionDate) {
      issue.expectedCompletionDate = expectedCompletionDate;
    }

    if (comment || reassigned) {
      const commentText = comment
        ? (reassigned ? `[Re-assigned to ${newAssigneeUser?.name} (${newAssigneeUser?.role})] - ${comment}` : comment)
        : `Re-assigned complaint to ${newAssigneeUser?.name} (${newAssigneeUser?.role})`;

      const effectiveUser = await getEffectiveUser(req);
      issue.comments.push({
        user: effectiveUser?._id,
        comment: commentText,
        targetDate: targetDate || expectedCompletionDate,
      });
    }

    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email department role')
      .populate('assignedTo', 'name email department role')
      .populate('comments.user', 'name email role department');

    if (reassigned && newAssigneeUser && newAssigneeUser.email) {
      sendIssueAssignmentEmail(updatedIssue, newAssigneeUser);
    }

    res.json(updatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update complaint initial details (Zone, Division, Station, Loco Number, Description, Photos)
// @route   PUT /api/issues/:id
// @access  Private
const updateIssue = async (req, res) => {
  try {
    const { zone, contract, station, locoNumber, details, issueRaisedDate, existingPhotos } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (issue.status === 'CLOSED') {
      return res.status(400).json({ message: 'Closed complaints cannot be edited.' });
    }

    if (zone !== undefined) issue.zone = zone;
    if (contract !== undefined) issue.contract = contract;
    if (station !== undefined) issue.station = station;
    if (locoNumber !== undefined) issue.locoNumber = locoNumber;
    if (details !== undefined) issue.details = details;

    // Handle existing and newly uploaded photos
    let updatedPhotos = issue.photos || [];
    if (existingPhotos !== undefined) {
      try {
        updatedPhotos = typeof existingPhotos === 'string' ? JSON.parse(existingPhotos) : existingPhotos;
      } catch (e) {
        updatedPhotos = Array.isArray(existingPhotos) ? existingPhotos : [existingPhotos];
      }
    }

    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map((file) => `/uploads/${file.filename}`);
      updatedPhotos = updatedPhotos.concat(newPhotos);
    }
    issue.photos = updatedPhotos;

    await issue.save();

    const updated = await Issue.findById(issue._id)
      .populate('createdBy', 'name email department role')
      .populate('assignedTo', 'name email department role')
      .populate('comments.user', 'name email role department');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  respondToIssue,
  updateIssue,
};
