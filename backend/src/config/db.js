const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || process.env.MONGODB_URL || 'mongodb://10.10.28.35:27017/issue_tracker';
  const authenticatedUri = 'mongodb://admin:NusAcr5qlFRuxepreyuh@10.10.28.35:27017/issue_tracker?authSource=admin';
  const fallbackUri = 'mongodb://127.0.0.1:27017/issue_tracker';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
      maxPoolSize: 50,
    });
    console.log(`Primary MongoDB Server Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB (${primaryUri}) unauthenticated connection failed: ${error.message}. Trying authenticated server connection...`);
    try {
      const connAuth = await mongoose.connect(authenticatedUri, {
        serverSelectionTimeoutMS: 3000,
        maxPoolSize: 50,
      });
      console.log(`Primary Authenticated MongoDB Server Connected: ${connAuth.connection.host}`);
    } catch (authErr) {
      console.warn(`Authenticated MongoDB (${authenticatedUri}) connection failed: ${authErr.message}. Attempting local fallback...`);
      try {
        const fallbackConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`Fallback Local MongoDB Connected: ${fallbackConn.connection.host}`);
      } catch (fallbackErr) {
        console.error(`Local MongoDB Fallback Connection Error: ${fallbackErr.message}`);
      }
    }
  }
};

module.exports = connectDB;
