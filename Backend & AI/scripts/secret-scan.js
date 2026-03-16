const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
function getStagedFiles() {
  const out = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim()
  return out ? out.split('\n').filter(Boolean) : []
}
function shouldSkip(file) {
  const bn = path.basename(file)
  if (bn.startsWith('.env')) return true
  if (/node_modules/.test(file)) return true
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico|lock)$/i.test(file)) return true
  return false
}
function read(file) {
  try { return fs.readFileSync(file, 'utf8') } catch { return '' }
}
function scan(content) {
  const patterns = [
    /AZURE_OPENAI_API_KEY\s*[=:]\s*[A-Za-z0-9_\-]{20,}/,
    /OPENAI_API_KEY\s*[=:]\s*sk-[A-Za-z0-9]{20,}/,
    /AWS_SECRET_ACCESS_KEY\s*[=:]\s*[A-Za-z0-9\/+=]{30,}/,
    /AWS_ACCESS_KEY_ID\s*[=:]\s*AKIA[0-9A-Z]{16}/,
    /GOOGLE_API_KEY\s*[=:]\s*AIza[0-9A-Za-z\-_]{20,}/,
    /JWT_SECRET\s*[=:]\s*[^\s]{16,}/,
    /SESSION_SECRET\s*[=:]\s*[^\s]{16,}/,
    /DB_PASSWORD\s*[=:]\s*[^\s]{10,}/,
    /-----BEGIN (RSA|EC|PRIVATE) KEY-----/
  ]
  for (const p of patterns) {
    if (p.test(content)) return true
  }
  return false
}
function main() {
  const files = getStagedFiles()
  const offenders = []
  for (const f of files) {
    if (shouldSkip(f)) continue
    const c = read(f)
    if (!c) continue
    if (scan(c)) offenders.push(f)
  }
  if (offenders.length) {
    console.error('Secret scan failed. Potential secrets found in:')
    offenders.forEach(f => console.error(' - ' + f))
    process.exit(1)
  }
}
main()
