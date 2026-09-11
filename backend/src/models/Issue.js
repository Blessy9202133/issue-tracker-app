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
    complaintCategory: {
      type: String,
      enum: ['WAYSIDE', 'ONBOARD'],
      default: 'WAYSIDE',
      required: true,
    },
    zone: {
      type: String,
      required: [true, 'Zone is required'],
      trim: true,
    },
    contract: {
      type: String,
      trim: true,
    },
    // Wayside Fields
    station: {
      type: String,
      trim: true,
    },
    complaintType: {
      type: String,
      trim: true,
    },

    // Onboard Fields
    shed: {
      type: String,
      trim: true,
    },
    locoNumber: {
      type: String,
      trim: true,
    },
    locoType: {
      type: String,
      trim: true,
    },
    brakeType: {
      type: String,
      trim: true,
    },
    failureType: {
      type: String,
      trim: true,
    },
    poLoaNumber: {
      type: String,
      trim: true,
    },

    // Common Fields
    details: {
      type: String,
      required: [true, 'Complaint description is required'],
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

// Indexes for ultra-fast query performance (1-5ms)
issueSchema.index({ issueCode: 1 });
issueSchema.index({ status: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ zone: 1 });
issueSchema.index({ complaintCategory: 1 });

// Auto generate issueCode before saving
issueSchema.pre('save', async function (next) {
  if (!this.issueCode) {
    const count = await mongoose.model('Issue').countDocuments();
    this.issueCode = `CMP-${1000 + count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
