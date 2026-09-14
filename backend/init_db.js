// MongoDB Initialization Script for Customer Complaint Portal (CCP)
// Usage: mongosh issue_tracker init_db.js

use issue_tracker;

// Create 'issues' collection
db.createCollection("issues");

// Create Indexes for ultra-fast query performance
db.issues.createIndex({ "issueCode": 1 }, { unique: true });
db.issues.createIndex({ "status": 1 });
db.issues.createIndex({ "zone": 1 });
db.issues.createIndex({ "complaintCategory": 1 });
db.issues.createIndex({ "createdAt": -1 });

print("Database 'issue_tracker' and collection 'issues' created successfully with all indexes!");
