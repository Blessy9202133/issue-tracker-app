const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  respondToIssue,
  updateIssue,
} = require('../controllers/issueController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .post(protect, upload.array('photos', 10), createIssue)
  .get(protect, getIssues);

router.route('/:id')
  .get(protect, getIssueById)
  .put(protect, upload.array('photos', 10), updateIssue);

router.route('/:id/respond')
  .put(protect, upload.array('analysisPhotos', 10), respondToIssue);

module.exports = router;
