const { generateNumericOtp } = require("./otpSecurity")

function generateOTP() {
  return generateNumericOtp(6)
}

module.exports = generateOTP;
