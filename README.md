# Customer Complaint Portal (CCP)

An enterprise-grade **Customer Complaint Portal** built for logging, analyzing, and tracking railway customer complaints using the **MEAN Stack** (**MongoDB**, **Express.js**, **Angular v19**, **Node.js**).

---

## 🌟 Key Capabilities & Features

1. **Direct Complaint Registration (`/create-issue`)**:
   - Root URL (`/`) opens the **Register Customer Complaint** page directly.
   - Soft green header navbar featuring left-aligned **HBL Logo**.
   - Input validation (Zone selection, Division, Station, Loco Number, 1000-word Description limit, and Photo/File attachments).
   - **Success Pop-up Modal**: Displays assigned Complaint Code (`MMYYDD-01` format) upon submission and resets form without leaving the page.

2. **Sequential Complaint ID (`MMYYDD-01` / `mmyydate-01`)**:
   - Auto-generates monthly sequential IDs (`MMYYDD-01`), e.g. `092614-01` (Month `09`, Year `26`, Date `14`, sequence count `01`).

3. **Dashboard & Metric Overview**:
   - Summary cards: **Total Complaints**, **Analysed**, and **Yet to Analyze**.
   - Single-line table headers (`ID`, `ZONE AND LOCATION`, `RAISED ON`, `PHOTOS/FILES`, `TYPE OF COMPLAINT`, `STATUS`, `ANALYSED DATE`, `ACTION`).
   - Filters by Type of Complaint, Status, and Railway Zone.

4. **Technical Analysis Workflow**:
   - 3 distinct input fields:
     - **Root Cause**
     - **Corrective Action**
     - **Preventive Action**
   - **Submission Pop-up Alert**: Displays confirmation modal (*"Analysis & files submitted successfully and complaint is now Closed."*) and redirects to `/dashboard` upon dismissal.
   - **Real-Time Analysed Date Timestamp**: Automatically updates the date and time on every analysis submission or edit.

---

## 🚀 Local Development Setup

### 1. Backend API (`Node.js` + `Express` + `MongoDB`)
```bash
cd backend
npm install
npm run dev
```
- API runs at `http://127.0.0.1:5000/api`.
- Ensure MongoDB is running locally on `mongodb://127.0.0.1:27017/issue_tracker`.

### 2. Frontend Application (`Angular v19`)
```bash
cd frontend
npm install
npm run build
```
- Compiled production artifacts are saved directly in `frontend/dist/`.

---

## 🌐 IIS Production Hosting Guide

Hosted alongside **WFMS** under: **`https://eg.hbl.in/customer-complaint-portal`**

### Step 1: Frontend Deployment
1. Build frontend:
   ```cmd
   cd frontend
   npm run build
   ```
2. Copy all files inside `frontend/dist/` (`index.html`, `web.config`, `hbl_logo.jpg`, `.js`, `.css`) to IIS application folder: `C:\inetpub\wwwroot\customer-complaint-portal\`.

### Step 2: Backend Deployment
1. Copy `backend/` directory to server.
2. Create `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/issue_tracker
   NODE_ENV=production
   ```
3. Grant **Write Permissions** (`IIS_IUSRS`) to `backend/uploads`.

---

## 💾 CCP Database Backup Setup (Shared MongoDB with WFMS)

The portal database (`issue_tracker` / `ccp_db`) runs on the shared MongoDB server alongside WFMS.

### Automated Daily Backup:
1. Located in `backend/src/scripts/backup_ccp.bat`.
2. Script runs `mongodump`:
   ```cmd
   mongodump --db=issue_tracker --out="C:\MongoDB_Backups\ccp_backup_%YYYYMMDD%"
   ```
3. Configure Windows Task Scheduler on DB Server to run `backup_ccp.bat` daily at 1:00 AM.

