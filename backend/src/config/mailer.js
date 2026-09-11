const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER !== 'test@ethereal.email'
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 3000, // 3s fast timeout
      greetingTimeout: 3000,
      socketTimeout: 3000,
    });
  }
  return null;
};

const sendIssueAssignmentEmail = async (issue, assigneeUser) => {
  // Run asynchronously without blocking HTTP response thread
  setImmediate(async () => {
    try {
      const transporter = createTransporter();
      if (!transporter) {
        console.log(`[Email Notice] Simulated email for Complaint ${issue.issueCode} to ${assigneeUser.name} (${assigneeUser.email})`);
        return;
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
      const issueLink = `${clientUrl}/issues/${issue._id}`;

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Customer Complaint Portal" <no-reply@complaintportal.com>',
        to: assigneeUser.email,
        subject: `[${issue.complaintCategory} Complaint Assigned] ${issue.issueCode} - Zone: ${issue.zone}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
              <h2>New ${issue.complaintCategory} Complaint Assigned</h2>
            </div>
            <div style="padding: 20px;">
              <p>Hello <strong>${assigneeUser.name}</strong>,</p>
              <p>You have been assigned a new complaint. Details:</p>
              <p><strong>Complaint Code:</strong> ${issue.issueCode}</p>
              <p><strong>Zone:</strong> ${issue.zone}</p>
              <p><strong>Details:</strong> ${issue.details}</p>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${issueLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  View & Respond
                </a>
              </div>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Email Sent] Complaint ${issue.issueCode} notification sent to ${assigneeUser.email}`);
    } catch (error) {
      console.error(`[Email Status] Network timeout / skip email dispatch for ${assigneeUser.email}:`, error.message);
    }
  });
};

module.exports = {
  sendIssueAssignmentEmail,
};
