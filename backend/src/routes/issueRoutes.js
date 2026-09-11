const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  respondToIssue,
} = require('../controllers/issueController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .post(protect, upload.array('photos', 5), createIssue)
  .get(protect, getIssues);

router.route('/:id')
  .get(protect, getIssueById);

router.route('/:id/respond')
  .put(protect, respondToIssue);

module.exports = router;
