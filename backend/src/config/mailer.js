// Email service disabled by default for maximum speed and instant HTTP responses
const sendIssueAssignmentEmail = (issue, assigneeUser) => {
  // Non-blocking console log only - zero network overhead
  console.log(`[Email Notice] Complaint ${issue.issueCode || issue._id} assigned to ${assigneeUser?.name} (${assigneeUser?.email})`);
};

module.exports = {
  sendIssueAssignmentEmail,
};
