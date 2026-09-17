const mongoose = require('mongoose');

const connectDB = async () => {
  const serverUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://admin:NusAcr5qlFRuxepreyuh@10.10.28.35:27017/issue_tracker?authSource=admin';
  try {
    const conn = await mongoose.connect(serverUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
    });
    console.log(`Server MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Server MongoDB (${serverUri}) Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
