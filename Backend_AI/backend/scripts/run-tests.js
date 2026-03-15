const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

require("dotenv").config({ path: path.join(__dirname, "..", ".env") })
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") })

const testsDir = path.join(__dirname, "..", "tests")
const includeDbTests = ["1", "true", "yes"].includes(String(process.env.RUN_DB_TESTS || "").toLowerCase())

const excludedByDefault = new Set(["principalDataGraphService.test.js"])

const testFiles = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith(".test.js"))
  .filter((f) => includeDbTests || !excludedByDefault.has(f))
  .sort()

if (testFiles.length === 0) {
  console.log("No tests found")
  process.exit(0)
}

for (const file of testFiles) {
  const fullPath = path.join(testsDir, file)
  const res = spawnSync(process.execPath, [fullPath], { stdio: "inherit" })
  if (res.status !== 0) {
    process.exit(res.status || 1)
  }
}
