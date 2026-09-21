const path = require('path');

const FOLDER_ROOT = process.env.FOLDER_ROOT || 'D:\\WFMS\\issue_tracker';

module.exports = {
  FOLDERS: {
    FOLDER_DATA_ROOT: FOLDER_ROOT,
    FOLDER_DATA_BACKUP: path.join(FOLDER_ROOT, 'backups'),
    FOLDER_DATA_LOGS: path.join(FOLDER_ROOT, 'logs'),
    FOLDER_DATA_FILES: path.join(FOLDER_ROOT, 'files'),
    FOLDER_DATA_CERTIFICATES: path.join(FOLDER_ROOT, 'certificates'),
  },
};
