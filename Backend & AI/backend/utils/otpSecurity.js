const crypto = require("crypto")
const { env } = require("../config/env")

function generateNumericOtp(length = 6) {
  const size = Number(length)
  const max = 10 ** size
  const min = 10 ** (size - 1)
  return String(crypto.randomInt(min, max))
}

function hashOtp(otp) {
  const normalized = String(otp || "").trim()
  const nonce = crypto.randomBytes(16).toString("hex")
  const digest = crypto
    .createHmac("sha256", env.otpHmacSecret)
    .update(`${nonce}:${normalized}`)
    .digest("hex")
  return `v1:${nonce}:${digest}`
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""))
  const right = Buffer.from(String(b || ""))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

function verifyOtp(plainOtp, storedOtpHash) {
  const incoming = String(plainOtp || "").trim()
  const stored = String(storedOtpHash || "")

  if (stored.startsWith("v1:")) {
    const [, nonce, digest] = stored.split(":")
    if (!nonce || !digest) return false
    const expected = crypto
      .createHmac("sha256", env.otpHmacSecret)
      .update(`${nonce}:${incoming}`)
      .digest("hex")
    return safeEqual(expected, digest)
  }

  // Backward compatibility for legacy plain-text OTP records.
  return safeEqual(incoming, stored)
}

module.exports = {
  generateNumericOtp,
  hashOtp,
  verifyOtp,
}

