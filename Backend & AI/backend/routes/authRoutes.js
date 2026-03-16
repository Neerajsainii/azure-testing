const express = require("express")
const router = express.Router()

const authController = require("../controllers/authController")
const authMiddleware = require("../middleware/authMiddleware")
const noStoreAuth = require("../middleware/noStoreAuth")
const validate = require("../middleware/validationMiddleware")
const { authLoginLimiter, signupLimiter, studentLoginLimiter } = require("../middleware/rateLimiter")
const { signupSchema, loginSchema, verifyOtpSchema, requestEmailVerificationSchema, inviteActivationSchema } = require("../validation/authValidation")

router.use(noStoreAuth)

router.post("/signup", signupLimiter, validate(signupSchema), authController.signup)
router.post("/login", authLoginLimiter, validate(loginSchema), authController.login)
router.post("/verify-email/request", studentLoginLimiter, validate(requestEmailVerificationSchema), authController.requestEmailVerification)
router.post("/verify-email/confirm", studentLoginLimiter, validate(verifyOtpSchema), authController.confirmEmailVerification)
router.get("/session", authMiddleware, authController.getSession)
router.post("/logout", authMiddleware, authController.logout)
router.post("/invite/activate", studentLoginLimiter, validate(inviteActivationSchema), authController.activateInvite)

// TEMPORARY DEBUG ROUTE
router.get("/debug-emails", async (req, res) => {
    try {
        const User = require("../models/User");
        const Invitation = require("../models/Invitation");
        const emails = ["chatgpt7690@gmail.com", "rahul5180singh@gmail.com"];
        const users = await User.find({ email: { $in: emails } }).lean();
        const invites = await Invitation.find({ email: { $in: emails } }).lean();
        res.json({ users, invites });
    } catch (e) { res.status(500).json({ error: e.message }) }
});

module.exports = router
