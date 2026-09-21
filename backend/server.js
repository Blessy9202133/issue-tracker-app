const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./src/config/db');
const { initBackupScheduler } = require('./src/utils/backupScheduler');
const Constants = require('./src/utils/Constants');
const Helper = require('./src/utils/Helper');
const issueRoutes = require('./src/routes/issueRoutes');
const authRoutes = require('./src/routes/authRoutes');
const { seedAdmin } = require('./src/controllers/authController');

// Connect Database & Seed default admin if needed
connectDB().then(() => {
  seedAdmin();
});

// Initialize automatic folder creation matching LOCO WFMS (files, certificates, logs, backups)
Helper.createFolders();

// Initialize Automatic Daily MongoDB Backup Scheduler
initBackupScheduler();

const app = express();

// Middlewares - Allow CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded photos/files (FOLDER_DATA_FILES with fallback to local uploads)
let uploadDir = Constants.FOLDERS.FOLDER_DATA_FILES;
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn(`Could not create ${uploadDir}: ${e.message}. Falling back to local uploads directory.`);
  uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/issues', issueRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Customer Complaint Portal For Kavach API is running smoothly' });
});

const PORT_HTTPS = parseInt(process.env.BACKEND_PORT_HTTPS || process.env.PORT || 4915, 10);
const PORT_HTTP = parseInt(process.env.BACKEND_PORT || 4916, 10);

// Auto-detect SSL Certificates (matching LOCO WFMS APIService)
function getSSLCertificates() {
  let keyPath = path.join(Constants.FOLDERS.FOLDER_DATA_CERTIFICATES, 'certificate.key');
  let certPath = path.join(Constants.FOLDERS.FOLDER_DATA_CERTIFICATES, 'certificate.crt');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { keyPath, certPath, certDir: Constants.FOLDERS.FOLDER_DATA_CERTIFICATES };
  }

  // Alternative locations search
  const searchDirs = [
    process.env.SSL_CERT_DIR,
    'D:\\WFMS\\KavachComplaintPortal\\backend\\certificates',
    'D:\\WFMS\\issue_tracker\\certificates',
    'D:\\WFMS\\certificates',
    'D:\\WFMS\\station-wfms\\certificates',
    'E:\\WFMS\\issue_tracker\\certificates',
    path.join(__dirname, 'certificates'),
  ].filter(Boolean);

  for (const certDir of searchDirs) {
    if (!fs.existsSync(certDir)) continue;
    try {
      const files = fs.readdirSync(certDir);
      const keyFile = files.find((f) => /key|private/i.test(f) && /\.(pem|key)$/i.test(f)) || files.find((f) => f.endsWith('.key'));
      const certFile = files.find((f) => /cert|crt|certificate/i.test(f) && !/ca|bundle/i.test(f) && /\.(pem|crt|cer)$/i.test(f)) || files.find((f) => f.endsWith('.crt') || f.endsWith('.pem'));
      if (keyFile && certFile) {
        return { keyPath: path.join(certDir, keyFile), certPath: path.join(certDir, certFile), certDir };
      }
    } catch (e) {
      console.warn(`Could not read cert directory ${certDir}: ${e.message}`);
    }
  }

  return null;
}

const sslConfig = getSSLCertificates();

if (sslConfig) {
  try {
    const sslOptions = {
      key: fs.readFileSync(sslConfig.keyPath),
      cert: fs.readFileSync(sslConfig.certPath),
    };

    // HTTPS API Server on PORT_HTTPS (4915)
    https.createServer(sslOptions, app).listen(PORT_HTTPS, () => {
      console.log(`Customer Complaint Portal HTTPS API running on port ${PORT_HTTPS} using SSL certs from ${sslConfig.certDir}`);
    });

    // HTTP redirect Server on PORT_HTTP (4916) matching LOCO WFMS APIService
    const httpServer = http.createServer((req, res) => {
      const host = (req.headers.host || '').split(':')[0];
      res.writeHead(301, { Location: `https://${host}:${PORT_HTTPS}${req.url}` });
      res.end();
    });
    httpServer.listen(PORT_HTTP, () => {
      console.log(`Customer Complaint Portal HTTP redirect service running on port ${PORT_HTTP}`);
    });
  } catch (err) {
    console.error(`Failed to start HTTPS server (${err.message}). Falling back to HTTP on port ${PORT_HTTPS}...`);
    http.createServer(app).listen(PORT_HTTPS, () => {
      console.log(`Customer Complaint Portal HTTP API running on port ${PORT_HTTPS}`);
    });
  }
} else {
  console.log(`SSL certs not found in certificates directory. Starting HTTP server on port ${PORT_HTTPS}...`);
  http.createServer(app).listen(PORT_HTTPS, () => {
    console.log(`Customer Complaint Portal HTTP API running on port ${PORT_HTTPS}`);
  });
}
