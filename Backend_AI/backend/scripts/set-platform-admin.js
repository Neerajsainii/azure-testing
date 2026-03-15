#!/usr/bin/env node
/**
 * One-time script to create or update Platform Admin in MongoDB.
 * Run: node scripts/set-platform-admin.js <email> <password>
 * Requires: .env with PLATFORM_ADMIN_EMAIL, JWT_SECRET, MONGO_URI
 */

require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") })
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const email = process.argv[2] || process.env.PLATFORM_ADMIN_EMAIL
const password = process.argv[3]

if (!email || !password) {
  console.error("Usage: node scripts/set-platform-admin.js <email> <password>")
  console.error("Or set PLATFORM_ADMIN_EMAIL and pass password as second arg.")
  process.exit(1)
}

const normalizedEmail = String(email).trim().toLowerCase()

const AdminSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" },
    isEmailVerified: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
  },
  { timestamps: true }
)
const Admin = mongoose.model("Admin", AdminSchema)

async function main() {
  await mongoose.connect(process.env.MONGO_URI)
  const hash = await bcrypt.hash(password, 12)
  const admin = await Admin.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        password_hash: hash,
        role: "admin",
        isEmailVerified: true,
        name: normalizedEmail.split("@")[0] || "Platform Admin",
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    },
    { new: true, upsert: true }
  )
  console.log("Platform Admin configured:", admin.email)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
