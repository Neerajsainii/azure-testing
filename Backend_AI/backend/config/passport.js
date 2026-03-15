"use strict";

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Admin = require("../models/Admin");

// ── Absolute callback URL ─────────────────────────────────────────────────────
// A relative callbackURL like "/api/auth/google/callback" can resolve
// incorrectly behind Azure SWA's reverse proxy because the protocol/host are
// stripped.  Always use the full production URL from the environment.
//
// Set GOOGLE_CALLBACK_URL in GitHub secrets to:
//   https://<your-app>.azurestaticapps.net/api/auth/google/callback
//
// For local dev, set it in .env to:
//   http://localhost:5000/api/auth/google/callback
const callbackURL =
  process.env.GOOGLE_CALLBACK_URL ||
  `${process.env.FRONTEND_URL || "http://localhost:5000"}/api/auth/google/callback`;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL,
      // Proxy: true tells passport to trust x-forwarded-proto so it builds
      // the redirect URI with https:// on Azure instead of http://.
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0]
            ? profile.emails[0].value
            : null;

        if (!email) {
          return done(null, false, { message: "No email returned from Google" });
        }

        // Only platform admins are permitted to use Google OAuth
        const admin = await Admin.findOne({ email, role: "admin" });
        if (!admin) {
          return done(null, false, { message: "Not authorized" });
        }

        return done(null, admin);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ── No serializeUser / deserializeUser ────────────────────────────────────────
// This application uses JWT, not sessions.  Omitting serialize/deserialize
// ensures passport never attempts to write to or read from the in-memory
// session store (which doesn't survive across Azure Functions workers).

module.exports = passport;