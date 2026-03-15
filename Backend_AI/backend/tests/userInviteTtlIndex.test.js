const assert = require("assert")

const User = require("../models/User")

;(async () => {
  const indexes = User.schema.indexes()
  const hasInviteTokenExpiryIndex = indexes.some(([spec]) => spec && spec.inviteTokenExpiry === 1)
  const hasInviteTokenExpiryTtlIndex = indexes.some(
    ([spec, opts]) => spec && spec.inviteTokenExpiry === 1 && opts && Object.prototype.hasOwnProperty.call(opts, "expireAfterSeconds")
  )

  assert.strictEqual(hasInviteTokenExpiryIndex, true)
  assert.strictEqual(hasInviteTokenExpiryTtlIndex, false)
  console.log("userInviteTtlIndex.test passed")
})()
