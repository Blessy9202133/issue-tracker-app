const fs = require('fs');
const Constants = require('./Constants');

module.exports = {
  createFolders: () => {
    Object.values(Constants.FOLDERS).forEach((folder) => {
      try {
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }
      } catch (err) {
        console.warn(`Could not create folder ${folder}: ${err.message}`);
      }
    });
  },
};
