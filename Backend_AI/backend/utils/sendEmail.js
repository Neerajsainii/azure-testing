"use strict";

const { EmailClient } = require("@azure/communication-email");
const { env } = require("../config/env");
const { logger } = require("./logger");

// ── Azure Communication Services client ──────────────────────────────────────
// Initialized once at module load using validated env values from config/env.js.
// If AZURE_COMMUNICATION_CONNECTION_STRING is not set, emailClient stays null
// and sendEmail() throws EMAIL_NOT_CONFIGURED — callers must handle this.
let emailClient = null;

if (env.azureCommunicationConnectionString) {
  try {
    emailClient = new EmailClient(env.azureCommunicationConnectionString);
  } catch (error) {
    // Log but don't crash the worker — email features will be unavailable
    // rather than blocking the entire Function cold start.
    logger.error("azure_email_client_init_failed", { message: error.message });
  }
}

/**
 * Send a plain-text email via Azure Communication Services.
 *
 * @param {string} to       - Recipient email address
 * @param {string} subject  - Email subject line
 * @param {string} text     - Plain-text email body
 * @throws {Error} EMAIL_NOT_CONFIGURED if ACS credentials are not set
 * @throws {Error} On ACS send failure
 */
const sendEmail = async (to, subject, text) => {
  if (!emailClient || !env.azureSenderEmail) {
    const error = new Error(
      "Email service is not configured. " +
      "Set AZURE_COMMUNICATION_CONNECTION_STRING and AZURE_SENDER_EMAIL in GitHub secrets."
    );
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  const poller = await emailClient.beginSend({
    senderAddress: env.azureSenderEmail,
    content: {
      subject,
      plainText: text,
    },
    recipients: {
      to: [{ address: to }],
    },
  });

  // pollUntilDone() waits for ACS to confirm delivery or fail.
  // Azure Functions default timeout is 5 min — ACS typically resolves in < 30s.
  await poller.pollUntilDone();

  logger.info("email_sent", {
    // Log domain only — never log the full recipient address
    recipientDomain: String(to || "").split("@")[1] || "unknown",
    subject,
  });
};

module.exports = sendEmail;