# Customer Complaint Portal (CCP)

Application for registering, managing, and analyzing railway customer complaints.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/issue_tracker
   NODE_ENV=production
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build for production:
   ```bash
   npm run build
   ```
   Output files will be generated in `frontend/dist`.

## IIS Deployment

1. Copy the contents of `frontend/dist` to the target web directory on the IIS server.
2. Deploy the `backend` directory to the server and start the backend service (`server.js`).
3. Ensure the `backend/uploads` folder has write permissions.
