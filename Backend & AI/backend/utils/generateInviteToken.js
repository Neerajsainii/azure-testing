const crypto = require("crypto");

/**
 * Generates a secure random invite token for student registration.
 * @returns {Object} { token: string, expiry: number }
 */
const generateInviteToken = () => {
  // Generate 32 bytes of secure random data and convert to hex string
  const token = crypto.randomBytes(32).toString("hex");
  // Expiry set to 48 hours from now (in milliseconds)
  const expiry = Date.now() + 48 * 60 * 60 * 1000;
  
  return { token, expiry };
};

module.exports = generateInviteToken;
