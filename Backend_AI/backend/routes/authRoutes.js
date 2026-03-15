const express = require("express")
const router = express.Router()

const authController = require("../controllers/authController")
const authMiddleware = require("../middleware/authMiddleware")
const noStoreAuth = require("../middleware/noStoreAuth")
const validate = require("../middleware/validationMiddleware")
const { authLoginLimiter, signupLimiter, studentLoginLimiter } = require("../middleware/rateLimiter")
const {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  requestEmailVerificationSchema,
  inviteActivationSchema,
} = require("../validation/authValidation")

// Prevent browsers from caching auth responses
router.use(noStoreAuth)

router.post("/signup", signupLimiter, validate(signupSchema), authController.signup)
router.post("/login", authLoginLimiter, validate(loginSchema), authController.login)
router.post("/verify-email/request", studentLoginLimiter, validate(requestEmailVerificationSchema), authController.requestEmailVerification)
router.post("/verify-email/confirm", studentLoginLimiter, validate(verifyOtpSchema), authController.confirmEmailVerification)
router.get("/session", authMiddleware, authController.getSession)
router.post("/logout", authMiddleware, authController.logout)
router.post("/invite/activate", studentLoginLimiter, validate(inviteActivationSchema), authController.activateInvite)

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Only mount Google OAuth routes when credentials are configured.
// This prevents passport from throwing on cold start when GOOGLE_CLIENT_ID
// is not set (e.g. staging environments where Google OAuth is disabled).
//
// session: false is required — this app uses JWT, not sessions.
// Enabling sessions would silently try to use the in-memory session store
// which does not survive across Azure Functions worker instances.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const passport = require("passport")
  require("../config/passport") // register GoogleStrategy

  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,          // JWT app — never use passport sessions
    })
  )

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,          // JWT app — never use passport sessions
      failureRedirect: "/login?error=google_failed",
    }),
    authController.googleCallback  // issues JWT, redirects to frontend
  )
}

// ── REMOVED: /debug-emails ────────────────────────────────────────────────────
// This route exposed raw User + Invitation MongoDB documents with no
// authentication.  It has been permanently removed for security.
// If you need to inspect records, use MongoDB Atlas or a local script.

module.exports = router