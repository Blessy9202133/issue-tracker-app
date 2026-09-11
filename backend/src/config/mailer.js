const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const sendIssueAssignmentEmail = async (issue, assigneeUser) => {
  try {
    const transporter = createTransporter();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
    const issueLink = `${clientUrl}/issues/${issue._id}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Customer Complaint Portal" <no-reply@complaintportal.com>',
      to: assigneeUser.email,
      subject: `[Complaint Assigned] ${issue.issueCode} - Zone: ${issue.zone}, Shed: ${issue.shed}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
            <h2>Customer Complaint Assigned to You</h2>
          </div>
          <div style="padding: 20px;">
            <p>Hello <strong>${assigneeUser.name}</strong>,</p>
            <p>A new customer complaint has been assigned to you. Here are the details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Complaint Code:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.issueCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Zone:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.zone}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Shed:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.shed}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Raised Date:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(issue.issueRaisedDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Details:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.details}</td>
              </tr>
            </table>

            <div style="margin-top: 25px; text-align: center;">
              <a href="${issueLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View & Respond to Complaint
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 10px; text-align: center; color: #6c757d; font-size: 12px;">
            Customer Complaint Portal &copy; 2026
          </div>
        </div>
      `,
    };

    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Sent] Complaint ${issue.issueCode} notification sent to ${assigneeUser.email} (MessageId: ${info.messageId})`);
    } else {
      console.log(`[Email Log Mode] Email notification to ${assigneeUser.email} for Complaint ${issue.issueCode} link: ${issueLink}`);
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

module.exports = {
  sendIssueAssignmentEmail,
};
