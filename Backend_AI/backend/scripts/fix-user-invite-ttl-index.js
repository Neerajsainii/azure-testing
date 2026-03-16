#!/usr/bin/env node
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") })
const mongoose = require("mongoose")

async function main() {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    console.error("MONGO_URI is required")
    process.exit(1)
  }

  await mongoose.connect(mongoUri)
  const User = require("../models/User")

  const indexes = await User.collection.indexes()
  const ttlIndexes = indexes.filter((idx) => {
    const isInviteExpiryKey = idx?.key && Object.keys(idx.key).length === 1 && idx.key.inviteTokenExpiry === 1
    const hasTtl = typeof idx?.expireAfterSeconds === "number"
    return isInviteExpiryKey && hasTtl
  })

  for (const idx of ttlIndexes) {
    await User.collection.dropIndex(idx.name)
    console.log(`Dropped TTL index: ${idx.name}`)
  }

  const remaining = await User.collection.indexes()
  const hasNonTtlIndex = remaining.some((idx) => {
    const isInviteExpiryKey = idx?.key && Object.keys(idx.key).length === 1 && idx.key.inviteTokenExpiry === 1
    const hasTtl = typeof idx?.expireAfterSeconds === "number"
    return isInviteExpiryKey && !hasTtl
  })

  if (!hasNonTtlIndex) {
    const createdName = await User.collection.createIndex({ inviteTokenExpiry: 1 }, { name: "inviteTokenExpiry_1" })
    console.log(`Created non-TTL index: ${createdName}`)
  } else {
    console.log("Non-TTL inviteTokenExpiry index already present")
  }

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
