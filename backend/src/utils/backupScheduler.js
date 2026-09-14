const cron = require("node-cron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const getFormattedDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

const runBackup = async () => {
  try {
    const backupBaseDir = process.env.BACKUP_PATH || "C:\\MongoDB_Backups";
    if (!fs.existsSync(backupBaseDir)) {
      fs.mkdirSync(backupBaseDir, { recursive: true });
    }

    const todayStr = getFormattedDate();
    const backupFolder = path.join(backupBaseDir, `ccp_backup_${todayStr}`);

    console.log(`[Automated Backup] Starting daily CCP database backup into: ${backupFolder}`);

    const dbName = mongoose.connection.name || "issue_tracker";
    const mongodumpCmd = `mongodump --db=${dbName} --out="${backupFolder}"`;

    exec(mongodumpCmd, async (error) => {
      if (error) {
        console.log(`[Automated Backup] Running native JSON database backup...`);
        await runNativeJsonBackup(backupFolder);
      } else {
        console.log(`[Automated Backup] Database backup completed via mongodump: ${backupFolder}`);
      }
    });

  } catch (err) {
    console.error("[Automated Backup Error]:", err.message);
  }
};

const runNativeJsonBackup = async (backupFolder) => {
  try {
    if (!fs.existsSync(backupFolder)) {
      fs.mkdirSync(backupFolder, { recursive: true });
    }

    const collections = Object.keys(mongoose.connection.collections);
    for (const collName of collections) {
      const docs = await mongoose.connection.collections[collName].find({}).toArray();
      const filePath = path.join(backupFolder, `${collName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
    }
    console.log(`[Automated Backup] Native JSON database backup completed: ${backupFolder}`);
  } catch (e) {
    console.error("[Automated Backup] Native JSON export error:", e.message);
  }
};

const initBackupScheduler = () => {
  console.log("[Automated Backup] Initializing automatic daily MongoDB backup scheduler (Runs daily at 1:00 AM)...");
  cron.schedule("0 1 * * *", () => {
    console.log("[Automated Backup] Daily 1:00 AM backup triggered...");
    runBackup();
  });
};

module.exports = { initBackupScheduler, runBackup };

