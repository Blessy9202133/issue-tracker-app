const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || process.env.MONGODB_URL || 'mongodb://10.10.28.35:27017/issue_tracker';
  const authenticatedUri = 'mongodb://admin:NusAcr5qlFRuxepreyuh@10.10.28.35:27017/issue_tracker?authSource=admin';
  const fallbackUri = 'mongodb://127.0.0.1:27017/issue_tracker';

  const connectWithOptions = async (uri) => {
    return await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
      maxPoolSize: 50,
    });
  };

  try {
    const conn = await connectWithOptions(primaryUri);
    console.log(`Primary MongoDB Server Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB (${primaryUri}) connection failed (${error.message}). Trying authenticated server connection...`);
    try {
      const connAuth = await connectWithOptions(authenticatedUri);
      console.log(`Primary Authenticated MongoDB Server Connected: ${connAuth.connection.host}`);
    } catch (authErr) {
      console.warn(`Authenticated MongoDB (${authenticatedUri}) connection failed (${authErr.message}). Switching to local MongoDB database...`);
      try {
        const fallbackConn = await connectWithOptions(fallbackUri);
        console.log(`Local Fallback MongoDB Connected: ${fallbackConn.connection.host}`);
      } catch (fallbackErr) {
        console.error(`Local MongoDB Fallback Connection Error: ${fallbackErr.message}`);
      }
    }
  }
};

// Monitor Mongoose connection errors at runtime to auto-switch to local fallback if network times out
mongoose.connection.on('error', (err) => {
  console.warn(`Mongoose runtime connection error: ${err.message}`);
  if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
    console.warn('Network timeout detected. Switching to local MongoDB fallback...');
    mongoose.disconnect().then(() => {
      mongoose.connect('mongodb://127.0.0.1:27017/issue_tracker', { serverSelectionTimeoutMS: 2500 }).catch((e) => console.error('Local fallback failed:', e.message));
    }).catch(() => {});
  }
});

module.exports = connectDB;
