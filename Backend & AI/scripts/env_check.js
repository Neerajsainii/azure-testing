const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') })
function present(k) { return !!process.env[k] }
const keys = [
  'MONGO_URI',
  'FRONTEND_URL',
  'CLERK_SECRET_KEY',
  'PLATFORM_ADMIN_EMAIL',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_DEPLOYMENT',
  'AZURE_OPENAI_API_VERSION'
]
const report = {}
for (const k of keys) report[k] = present(k)
console.log(report)
