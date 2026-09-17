const mongoose = require('mongoose');
const Issue = require('../models/Issue');

// @desc    Create a new customer complaint
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res) => {
  try {
    console.log('Incoming issue creation payload:', req.body);
    const {
      complaintCategory,
      zone,
      contract,
      station,
      complaintType,
      otherComplaintType,
      shed,
      locoNumber,
      occurrenceDate,
      occurrenceTime,
      locoType,
      brakeType,
      failureType,
      poLoaNumber,
      details,
      issueRaisedDate,
    } = req.body;

   if (!zone?.trim() || !contract?.trim() || !station?.trim() || !locoNumber?.trim() || !occurrenceDate || !occurrenceTime || !details?.trim()) {
      return res.status(400).json({ message: 'Zone, Division, Station, Loco Number, Date of Occurrence, Time of Occurrence, and Complaint description are required' });
    }

    // Process uploaded photo paths
    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = req.files.map((file) => `/uploads/${file.filename}`);
    }

    let parsedOccurrenceDate = null;
    if (occurrenceDate && typeof occurrenceDate === 'string' && occurrenceDate.trim()) {
      const dateStr = occurrenceDate.includes('T') ? occurrenceDate : `${occurrenceDate.trim()}T00:00:00`;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        parsedOccurrenceDate = d;
      }
    } else if (occurrenceDate instanceof Date && !isNaN(occurrenceDate.getTime())) {
      parsedOccurrenceDate = occurrenceDate;
    }

    const issueData = {
      complaintCategory: complaintCategory || 'WAYSIDE',
      zone,
      contract,
      station,
      complaintType,
      otherComplaintType: complaintType === 'Others' ? (otherComplaintType || '') : '',
      shed,
      locoNumber,
      occurrenceDate: parsedOccurrenceDate,
      occurrenceTime: occurrenceTime ? occurrenceTime.trim() : '',
      locoType,
      brakeType,
      failureType,
      poLoaNumber,
      details,
      issueRaisedDate: issueRaisedDate || Date.now(),
      photos,
      status: 'OPEN',
    };

    const issue = await Issue.create(issueData);
    res.status(201).json(issue);
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
    const { status, zone, shed, complaintCategory, complaintType } = req.query;
    let query = {};

    if (status) {
      if (status === 'ANALYSED') {
        query.$or = [{ status: { $in: ['RESOLVED', 'CLOSED'] } }, { analysis: { $exists: true, $ne: '' } }];
      } else {
        query.status = status;
      }
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

    const issues = await Issue.find(query)
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

    const issue = await Issue.findOne(query).lean();

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
    const { comment, targetDate, status, expectedCompletionDate, reassignTo, analysis, actionTaken, preventiveAction, complaintType, otherComplaintType } = req.body;

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
    if (preventiveAction !== undefined) {
      issue.preventiveAction = preventiveAction;
    }
    if (complaintType !== undefined) {
      issue.complaintType = complaintType;
      if (complaintType === 'Others') {
        if (otherComplaintType !== undefined) {
          issue.otherComplaintType = otherComplaintType;
        }
      } else {
        issue.otherComplaintType = '';
      }
    } else if (otherComplaintType !== undefined) {
      issue.otherComplaintType = otherComplaintType;
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

    if (status) {
      issue.status = status;
    }

    if (issue.status === 'CLOSED' || issue.status === 'RESOLVED' || analysis !== undefined) {
      issue.closedDate = new Date();
    }

    if (expectedCompletionDate) {
      issue.expectedCompletionDate = expectedCompletionDate;
    }

    if (comment) {
      issue.comments.push({
        comment,
        targetDate: targetDate || expectedCompletionDate,
      });
    }

    await issue.save();
    const updatedIssue = await Issue.findById(issue._id);
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
    const { zone, contract, station, locoNumber, occurrenceDate, occurrenceTime, details, issueRaisedDate, existingPhotos } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (issue.status === 'CLOSED') {
      return res.status(400).json({ message: 'Closed complaints cannot be edited.' });
    }

    if (zone !== undefined) {
      if (!zone.trim()) return res.status(400).json({ message: 'Zone is required' });
      issue.zone = zone;
    }
    if (contract !== undefined) {
      if (!contract.trim()) return res.status(400).json({ message: 'Division is required' });
      issue.contract = contract;
    }
    if (station !== undefined) {
      if (!station.trim()) return res.status(400).json({ message: 'Station is required' });
      issue.station = station;
    }
    if (locoNumber !== undefined) {
      if (!locoNumber.trim()) return res.status(400).json({ message: 'Loco Number is required' });
      issue.locoNumber = locoNumber;
    }
    if (occurrenceDate !== undefined) {
      if (occurrenceDate && typeof occurrenceDate === 'string' && occurrenceDate.trim()) {
        const dateStr = occurrenceDate.includes('T') ? occurrenceDate : `${occurrenceDate.trim()}T00:00:00`;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          issue.occurrenceDate = d;
        } else {
          issue.occurrenceDate = null;
        }
      } else if (occurrenceDate instanceof Date && !isNaN(occurrenceDate.getTime())) {
        issue.occurrenceDate = occurrenceDate;
      } else {
        issue.occurrenceDate = null;
      }
    }
    if (occurrenceTime !== undefined) {
      issue.occurrenceTime = occurrenceTime ? occurrenceTime.trim() : '';
    }
    if (details !== undefined) {
      if (!details.trim()) return res.status(400).json({ message: 'Complaint description is required' });
      issue.details = details;
    }

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
    const updated = await Issue.findById(issue._id);
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
