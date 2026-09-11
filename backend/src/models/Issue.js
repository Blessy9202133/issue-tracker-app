const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    targetDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const issueSchema = new mongoose.Schema(
  {
    issueCode: {
      type: String,
      unique: true,
    },
    zone: {
      type: String,
      required: [true, 'Zone is required'],
      trim: true,
    },
    shed: {
      type: String,
      required: [true, 'Shed is required'],
      trim: true,
    },
    details: {
      type: String,
      required: [true, 'Issue details are required'],
      trim: true,
    },
    issueRaisedDate: {
      type: Date,
      default: Date.now,
    },
    expectedCompletionDate: {
      type: Date,
    },
    photos: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Auto generate issueCode before saving
issueSchema.pre('save', async function (next) {
  if (!this.issueCode) {
    const count = await mongoose.model('Issue').countDocuments();
    this.issueCode = `ISS-${1000 + count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
