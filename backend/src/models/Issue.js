const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
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
    closedDate: {
      type: Date,
    },
    analysis: {
      type: String,
      trim: true,
    },
    actionTaken: {
      type: String,
      trim: true,
    },
    preventiveAction: {
      type: String,
      trim: true,
    },
    photos: [
      {
        type: String,
      },
    ],
    analysisPhotos: [
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
      required: false,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for ultra-fast query performance
issueSchema.index({ status: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ zone: 1 });
issueSchema.index({ complaintCategory: 1 });

// Auto generate issueCode before saving in MMYYDD-01 format (mmyydate-01, sequence is monthly count)
issueSchema.pre('save', async function (next) {
  if (!this.issueCode) {
    const now = this.issueRaisedDate ? new Date(this.issueRaisedDate) : new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const day = String(now.getDate()).padStart(2, '0');
    const monthKey = `${month}${year}`;
    const mmyydate = `${month}${year}${day}`;

    const count = await mongoose.model('Issue').countDocuments({
      issueCode: { $regex: `^${monthKey}` },
    });

    const sequence = String(count + 1).padStart(2, '0');
    this.issueCode = `${mmyydate}-${sequence}`;
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
