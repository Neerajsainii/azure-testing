async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch (_) {
    json = null
  }
  return { status: res.status, json, text }
}

async function run() {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000"

  const results = []
  results.push({ name: "health", ...(await request("GET", `${baseUrl}/health`)) })
  results.push({ name: "ready", ...(await request("GET", `${baseUrl}/health/ready`)) })
  results.push({
    name: "verify_email_request",
    ...(await request("POST", `${baseUrl}/api/auth/verify-email/request`, { email: "test@example.com" })),
  })
  results.push({
    name: "verify_email_confirm",
    ...(await request("POST", `${baseUrl}/api/auth/verify-email/confirm`, { email: "test@example.com", otp: "000000" })),
  })

  for (const item of results) {
    const payload = item.json || item.text
    console.log(`${item.name}: ${item.status}`)
    console.log(payload)
  }
}

run().catch((err) => {
  console.error("smoke_failed", err)
  process.exitCode = 1
})
