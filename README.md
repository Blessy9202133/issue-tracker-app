# Issue Tracker Application (MEAN Stack)

An enterprise-ready Issue Management & Reporting System built with **Angular (v19)**, **Node.js (Express)**, **MongoDB**, and **Nodemailer**.

## 🌟 Key Features
- **User Authentication**: Secure JWT-based Login and Registration (with Reporter, Assignee, and Admin roles).
- **Issue Reporting**: Form to submit issues with **Zone**, **Shed**, **Issue Description**, **Raised Date**, **Photo Attachments**, and **Assignee**.
- **Automated Email Notifications**: Assignee automatically receives an email notification containing a direct link to review and respond.
- **Responder Workflow**: Assignees view photos, update issue status (*Open*, *In Progress*, *Resolved*, *Closed*), set target completion dates, and post response comments.
- **Dashboard & Filtering**: Filter issues by status, zone, shed, and view metric overview counters.

---

## 🚀 Getting Started

### 1. Backend Setup (Node.js + Express + MongoDB)
```bash
cd backend
npm install
# Ensure MongoDB is running on mongodb://127.0.0.1:27017/issue_tracker or update .env
npm run dev
```
The backend API will run on `http://localhost:5000`.

> **Note**: Demo user accounts are automatically created on first run:
> - **Reporter**: `manager@issuetracker.com` (password: `password123`)
> - **Assignee 1**: `john.tech@issuetracker.com` (password: `password123`)
> - **Assignee 2**: `sarah.eng@issuetracker.com` (password: `password123`)

---

### 2. Frontend Setup (Angular)
```bash
cd frontend
npm install
npx ng serve
```
Open your browser at `http://localhost:4200`.

---

## 🛠️ Tech Stack
- **Frontend**: Angular, TypeScript, Reactive/Template Forms, RxJS, CSS3.
- **Backend**: Node.js, Express.js, Mongoose ORM, JWT Authentication.
- **Database**: MongoDB.
- **File Uploads**: Multer (stores photos in `/uploads`).
- **Emails**: Nodemailer with SMTP transport.
