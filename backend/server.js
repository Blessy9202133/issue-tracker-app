const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const { initBackupScheduler } = require('./src/utils/backupScheduler');
const issueRoutes = require('./src/routes/issueRoutes');

dotenv.config();

// Connect Database
connectDB();

// Initialize Automatic Daily MongoDB Backup Scheduler
initBackupScheduler();

const app = express();

// Middlewares - Allow CORS from localhost & 127.0.0.1
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/issues', issueRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Customer Complaint Portal For Kavach API is running smoothly' });
});

const fs = require('fs');
const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 4915;

// Function to auto-detect SSL certificates in server directory
function findSSLCertificates() {
  const possibleFolderPaths = [
    process.env.SSL_CERT_DIR,
    'E:\\WFMS\\issue_tracker\\certificates',
    path.join(__dirname, 'certificates'),
    path.join(__dirname, 'cert'),
    path.join(__dirname, '..', 'certificates'),
  ].filter(Boolean);

  for (const certDir of possibleFolderPaths) {
    if (!fs.existsSync(certDir)) continue;

    try {
      const files = fs.readdirSync(certDir);
      const keyFile = files.find((f) => /key|private/i.test(f) && /\.(pem|key)$/i.test(f)) || files.find((f) => f.endsWith('.key'));
      const certFile = files.find((f) => /cert|crt|certificate/i.test(f) && !/ca|bundle/i.test(f) && /\.(pem|crt|cer)$/i.test(f)) || files.find((f) => f.endsWith('.crt') || f.endsWith('.pem'));

      if (keyFile && certFile) {
        return {
          keyPath: path.join(certDir, keyFile),
          certPath: path.join(certDir, certFile),
          certDir,
        };
      }
    } catch (e) {
      console.warn(`Could not read cert dir ${certDir}: ${e.message}`);
    }
  }

  if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH && fs.existsSync(process.env.SSL_KEY_PATH) && fs.existsSync(process.env.SSL_CERT_PATH)) {
    return {
      keyPath: process.env.SSL_KEY_PATH,
      certPath: process.env.SSL_CERT_PATH,
      certDir: path.dirname(process.env.SSL_KEY_PATH),
    };
  }

  return null;
}

const sslConfig = findSSLCertificates();

if (sslConfig) {
  try {
    const sslOptions = {
      key: fs.readFileSync(sslConfig.keyPath),
      cert: fs.readFileSync(sslConfig.certPath),
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`Customer Complaint Portal HTTPS API running on port ${PORT} using SSL certs from ${sslConfig.certDir}`);
    });
  } catch (err) {
    console.error(`Failed to start HTTPS server with SSL certs (${err.message}). Falling back to HTTP...`);
    http.createServer(app).listen(PORT, () => {
      console.log(`Customer Complaint Portal HTTP API running on port ${PORT}`);
    });
  }
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`Customer Complaint Portal HTTP API running on port ${PORT}`);
  });
}

