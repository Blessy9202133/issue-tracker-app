# Technical Deployment Report: Customer Complaint Portal (CCP) vs. WFMS

This document explains why **HBL LOCO WFMS** functions without SSL/network issues and provides the exact setup required for the **Customer Complaint Portal (CCP)** backend on your Windows IIS server.

---

## 1. Technical Analysis: Why WFMS Works vs. Why CCP Failed

| Requirement | HBL LOCO WFMS | CCP Current Setup | Result / Issue |
| :--- | :--- | :--- | :--- |
| **Frontend Protocol** | `https://eg.hbl.in/wfms` | `https://eg.hbl.in/ccp` | Both use secure **HTTPS (Port 443)** |
| **Backend Protocol** | `https://wfms.upskill365.com/api` (or `https://eg.hbl.in/wfms-api`) | `http://10.10.28.35:5000` | **Mixed Content Error**: Browsers block `http://` calls from inside `https://` sites |
| **Port Exposure** | Standard **Port 443** (HTTPS) | Standalone **Port 5000** | **Firewall Block / Timeout**: Windows Firewall blocks incoming TCP 5000 from client PCs (`ERR_CONNECTION_TIMED_OUT`) |

### Summary of Root Cause:
* **WFMS** hosts both its Frontend AND Backend under **HTTPS (Port 443)**.
* **CCP Frontend** is running under **HTTPS (Port 443)**, but the **CCP Backend** is running as a standalone unencrypted HTTP listener on **Port 5000**.
* When client laptops load `https://eg.hbl.in/ccp`, modern web browsers (Chrome, Edge, Firefox) block all `http://` network requests for security, and Windows Firewall blocks Port 5000.

---

## 2. Recommended Solutions for IT Team

To make CCP work seamlessly across all client laptops on the network just like WFMS, IT can choose **Option A** (Recommended) or **Option B**:

### Option A: Create an HTTPS Application Endpoint for CCP Backend (Identical to WFMS)
1. Open **IIS Manager** on server `10.10.28.35`.
2. Under the site `https://eg.hbl.in`, create an **Application** named **`ccp-api`** (or reverse proxy route `/ccp-api`).
3. Bind the backend API to `https://eg.hbl.in/ccp-api`.
4. In `backend/.env`, set:
   ```env
   PORT=5000
   MONGO_URI=mongodb://admin:NusAcr5qlFRuxepreyuh@10.10.28.35:27017/issue_tracker?authSource=admin
   NODE_ENV=production
   ```

* **Advantage**: Both Frontend (`https://eg.hbl.in/ccp`) and Backend (`https://eg.hbl.in/ccp-api`) will use HTTPS on Port 443. Zero SSL errors, zero firewall port blocks!

---

### Option B: Enable Proxy in IIS (ARR) or Open Port 5000 in Windows Firewall
If running the backend standalone on Port 5000:
1. **Enable Proxy in IIS ARR**: Open IIS Manager -> Root Server Node -> **Application Request Routing Cache** -> **Server Proxy Settings** -> Check **"Enable proxy"** -> **Apply**.
2. **Open Windows Firewall Port**: In Windows Defender Firewall on `10.10.28.35`, add an **Inbound Rule** allowing **TCP Port 5000**.

---

## 3. Deployment Checklists

### Frontend Deployment:
- Copy contents of `dist` (`index.html`, `web.config`, `main-xxx.js`, `styles-xxx.css`, `hbl_logo.jpg`) into `D:\WFMS\issue_tracker\`.

### Backend Deployment:
- Ensure Node.js service is running via PM2:
  ```cmd
  cd D:\WFMS\issue_tracker\backend
  pm2 start server.js --name "ccp-backend"
  pm2 save
  ```
