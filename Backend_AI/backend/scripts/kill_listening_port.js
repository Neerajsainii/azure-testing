const { execSync } = require("child_process")

function getPort() {
  const raw = process.env.KILL_PORT || process.env.PORT || "5000"
  const port = Number(raw)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error("Invalid port")
  return port
}

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" })
}

function parseNetstat(output, port) {
  const lines = String(output || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const pids = new Set()
  for (const line of lines) {
    if (!line.toUpperCase().startsWith("TCP")) continue
    const parts = line.split(/\s+/)
    const local = parts[1] || ""
    const state = (parts[3] || "").toUpperCase()
    const pid = parts[4] || parts[parts.length - 1]
    if (state !== "LISTENING") continue
    if (!local.endsWith(`:${port}`)) continue
    if (pid && /^\d+$/.test(pid)) pids.add(pid)
  }
  return Array.from(pids)
}

function getProcessName(pid) {
  const out = run(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`).trim()
  if (!out || out.toLowerCase().includes("no tasks")) return null
  const first = out.split("\n")[0] || ""
  const cols = first.split("\",\"").map((c) => c.replace(/^\"|\"$/g, ""))
  return cols[0] || null
}

function killPid(pid) {
  run(`taskkill /PID ${pid} /F`)
}

function main() {
  const port = getPort()
  let pids = []
  try {
    const netstat = run("netstat -ano -p tcp")
    pids = parseNetstat(netstat, port)
  } catch (_err) {
    try {
      const out = run(
        `powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort ${port} | Select-Object -ExpandProperty OwningProcess"`
      )
      pids = String(out || "")
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter((x) => /^\d+$/.test(x))
    } catch (_innerErr) {
      pids = []
    }
  }

  if (pids.length === 0) {
    console.log(`No LISTENING process found on port ${port}`)
    return
  }

  for (const pid of pids) {
    const name = getProcessName(pid)
    console.log(`Found PID ${pid} (${name || "unknown"}) on port ${port}`)
    if (name && name.toLowerCase() !== "node.exe") {
      console.log(`Skipping PID ${pid} because it is not node.exe`)
      continue
    }
    killPid(pid)
    console.log(`Killed PID ${pid}`)
  }
}

main()
