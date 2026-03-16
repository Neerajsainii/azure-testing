const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Admin = require("../models/Admin");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // Only platform admin allowed
        let admin = await Admin.findOne({ email, role: "admin" });
        if (!admin) return done(null, false);

        return done(null, admin);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

module.exports = passport;
