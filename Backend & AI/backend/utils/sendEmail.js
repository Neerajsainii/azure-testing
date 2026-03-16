// const nodemailer = require("nodemailer");
const { EmailClient } = require("@azure/communication-email");
const { logger } = require("./logger")

// --- START NODEMAILER CONFIGURATION (COMMENTED OUT) ---
/*
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
*/
// --- END NODEMAILER CONFIGURATION ---

// Initialize Azure Email Client
const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const senderEmail = process.env.AZURE_SENDER_EMAIL;
let emailClient = null;

if (connectionString) {
  try {
    emailClient = new EmailClient(connectionString);
  } catch (error) {
    logger.error("azure_email_client_init_failed", { message: error.message });
  }
}

/**
 * Send an email using the configured transporter.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} text - Email body text.
 */
const sendEmail = async (to, subject, text) => {
  // --- START NODEMAILER IMPLEMENTATION (COMMENTED OUT) ---
  /*
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const error = new Error("Email service is not configured")
    error.code = "EMAIL_NOT_CONFIGURED"
    throw error
  }

  await transporter.sendMail({
    from: `"STON Technology" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });

  const recipientDomain = String(to || "").split("@")[1] || "unknown"
  logger.info("email_sent", {
    recipientDomain,
    subject,
  })
  */
  // --- END NODEMAILER IMPLEMENTATION ---

  if (!emailClient || !senderEmail) {
    const error = new Error("Azure Email service is not configured (missing connection string or sender email)");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  try {
    const poller = await emailClient.beginSend({
      senderAddress: senderEmail,
      content: {
        subject: subject,
        plainText: text,
      },
      recipients: {
        to: [{ address: to }],
      },
    });

    await poller.pollUntilDone();

    const recipientDomain = String(to || "").split("@")[1] || "unknown";
    logger.info("email_sent", {
      recipientDomain,
      subject,
    });
  } catch (error) {
    logger.error("azure_email_send_failed", { message: error.message });
    throw error;
  }
};

module.exports = sendEmail;
