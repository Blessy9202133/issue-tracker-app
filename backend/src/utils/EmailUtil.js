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

const sendForgotPasswordEmail = async (name, email, hash) => {
  const resetLink = `${WEB_URL}/reset-password?hash=${hash}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #065f46;">Customer Complaint Portal - Password Reset</h2>
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

  try {
    await transporter.sendMail({
      from: `Customer Complaint Portal <${EMAIL_USER}>`,
      to: email,
      subject: 'CCP - Password Reset Request',
      html,
    });
    console.log(`Password reset email sent to ${email}`);
    return { status: true, message: 'Password reset link sent to your email.' };
  } catch (err) {
    console.warn(`Could not send password reset email via SMTP (${err.message}). Reset link generated: ${resetLink}`);
    return { status: true, message: 'Password reset link generated.', hash, resetLink };
  }
};

module.exports = {
  sendForgotPasswordEmail,
};
