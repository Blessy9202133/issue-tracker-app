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

    let templateSpecificRows = '';
    if (issue.complaintCategory === 'WAYSIDE') {
      templateSpecificRows = `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Contract:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.contract || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Station:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.station || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Complaint Type:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.complaintType || 'N/A'}</td>
        </tr>
      `;
    } else {
      templateSpecificRows = `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Contract:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.contract || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Shed Name:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.shed || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Loco Number:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.locoNumber || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Loco Type / Brake Type:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.locoType || 'N/A'} / ${issue.brakeType || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Failure Type / PO-LOA No:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.failureType || 'N/A'} (PO/LOA: ${issue.poLoaNumber || 'N/A'})</td>
        </tr>
      `;
    }

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
            <p>You have been assigned a new <strong>${issue.complaintCategory}</strong> customer complaint. Details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Complaint Code:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.issueCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Category:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.complaintCategory}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Zone:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.zone}</td>
              </tr>
              ${templateSpecificRows}
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Raised Date:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(issue.issueRaisedDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Description:</td>
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
