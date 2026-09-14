@echo off
:: Customer Complaint Portal (CCP) Database Backup Script
:: Backs up the MongoDB ccp_db / issue_tracker database to date-stamped folders

for /f "tokens=2-4 delims=/ " %%a in ("%date%") do (set YYYYMMDD=%%c%%a%%b)
if "%YYYYMMDD%"=="" set YYYYMMDD=%date:~-4,4%%date:~-7,2%%date:~-10,2%

set BACKUP_DIR=C:\MongoDB_Backups\ccp_backup_%YYYYMMDD%
echo Starting CCP Database Backup into %BACKUP_DIR%...

mongodump --db=issue_tracker --out="%BACKUP_DIR%"

echo CCP Database Backup Completed Successfully!

