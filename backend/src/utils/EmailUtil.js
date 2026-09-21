const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USERNAME || 'itgpuri@hbl.in';
const EMAIL_PASS = process.env.EMAIL_PASSWORD || 'Strong#2026';
const WEB_URL = process.env.WEB_URL || 'https://eg.hbl.in/KavachComplaintPortal';

const transporter = nodemailer.createTransport({
  host: 'smtp.hbl.in',
  port: 587,
  secure: false,
  tls: { rejectUnauthorized: false },
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// In-Memory Background Email Queue Service (Matching WFMS 1:1)
const emailQueue = [];
let isProcessingQueue = false;

const processEmailQueue = async () => {
  if (isProcessingQueue || emailQueue.length === 0) return;
  isProcessingQueue = true;

  while (emailQueue.length > 0) {
    const job = emailQueue.shift();
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!success && attempts < maxAttempts) {
      attempts++;
      try {
        await transporter.sendMail(job.mailOptions);
        console.log(`[Email Queue Worker] ✓ Email successfully dispatched to ${job.mailOptions.to} (Attempt ${attempts})`);
        success = true;
      } catch (err) {
        console.warn(`[Email Queue Worker] ⚠️ Attempt ${attempts}/${maxAttempts} failed for ${job.mailOptions.to}: ${err.message}`);
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempts));
        } else {
          console.error(`[Email Queue Worker] ❌ Email delivery failed permanently for ${job.mailOptions.to}. Fallback Link: ${job.fallbackLink || 'N/A'}`);
        }
      }
    }
  }

  isProcessingQueue = false;
};

// Enqueue email job into background queue service
const enqueueEmail = (mailOptions, fallbackLink = null) => {
  emailQueue.push({ mailOptions, fallbackLink });
  setImmediate(processEmailQueue);
};

const sendForgotPasswordEmail = async (name, email, hash) => {
  const baseUrl = WEB_URL.replace(/\/+$/, '');
  const resetLink = `${baseUrl}/reset-password?hash=${hash}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Customer Complaint Portal - Password Reset</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
      </p>
      <p style="font-size: 0.9em; color: #64748b;">This reset link will expire in 30 minutes. If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 0.8em; color: #94a3b8;">Customer Complaint Portal For Kavach &copy; HBL Power Systems Ltd.</p>
    </div>
  `;

  const mailOptions = {
    from: `Customer Complaint Portal <${EMAIL_USER}>`,
    to: email,
    subject: 'CCP - Password Reset Request',
    html,
  };

  enqueueEmail(mailOptions, resetLink);

  return {
    status: true,
    message: 'Password reset link has been queued for email delivery.',
    resetLink,
  };
};

module.exports = {
  sendForgotPasswordEmail,
  enqueueEmail,
};
