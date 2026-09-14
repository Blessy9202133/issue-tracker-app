const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  respondToIssue,
  updateIssue,
} = require('../controllers/issueController');
const upload = require('../middleware/upload');

router.route('/')
  .post(upload.array('photos', 10), createIssue)
  .get(getIssues);

router.route('/:id')
  .get(getIssueById)
  .put(upload.array('photos', 10), updateIssue);

router.route('/:id/respond')
  .put(upload.array('analysisPhotos', 10), respondToIssue);

module.exports = router;
