require("dotenv").config();

// Force IPv4 for outbound DNS on Azure — avoids connection issues on some
// regions where IPv6 routes to external services are unstable.
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { env } = require("./config/env");
const { ROLES } = require("./constants/roles");
const { logger } = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const requestSanitizer = require("./middleware/requestSanitizer");
const responseHardener = require("./middleware/responseHardener");
const { globalApiLimiter } = require("./middleware/rateLimiter");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const app = express();

// ── Trust proxy ───────────────────────────────────────────────────────────────
// Must be set BEFORE any middleware that reads req.ip (including rate limiters).
// In Azure Static Web Apps, the Functions worker always sits behind a reverse
// proxy, so trust proxy must be on regardless of the env flag.
const isRunningInAzureFunctions = Boolean(process.env.FUNCTIONS_WORKER_RUNTIME);
if (env.trustProxy || isRunningInAzureFunctions) {
  app.set("trust proxy", 1);
}

// ── CORS ──────────────────────────────────────────────────────────────────────
// IMPORTANT: Use env.corsAllowedOrigins (parsed by config/env.js), NOT
// process.env.CORS_ALLOWED_ORIGINS directly.  env.corsAllowedOrigins is the
// union of FRONTEND_URL + ADMIN_FRONTEND_URL + CORS_ALLOWED_ORIGINS list.
// Reading process.env directly would silently exclude FRONTEND_URL and
// ADMIN_FRONTEND_URL, causing every frontend request to get CORS-denied.
const allowedOrigins = env.corsAllowedOrigins; // string[] built by config/env.js

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const err = new Error("Not allowed by CORS");
      err.statusCode = 403;
      err.code = "CORS_DENIED";
      callback(err);
    }
  },
  credentials: false,
};

app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use(express.json({ limit: env.jsonBodyLimit }));
app.use(express.urlencoded({ extended: false, limit: env.jsonBodyLimit }));
app.use(requestLogger);
app.use(responseHardener);
app.use("/api", globalApiLimiter);
app.use("/api", requestSanitizer);

// ── Health routes ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "STON Technology Backend Running" });
});

function isHealthAuthorized(req) {
  if (!env.isProduction) return true;
  if (!env.healthCheckKey) return true;
  return (
    String(req.headers["x-health-check-key"] || "") ===
    String(env.healthCheckKey)
  );
}

app.get("/health", async (req, res) => {
  try {
    const dbState =
      mongoose.connection.readyState === 1 ? "UP" : "DOWN";
    const azureConfigured = Boolean(
      env.azureOpenAiApiKey &&
        env.azureOpenAiEndpoint &&
        env.azureOpenAiDeployment
    );
    const checks = {
      database: dbState,
      platformAdminConfigured: Boolean(env.platformAdminEmail),
      azureOpenAiConfigured: azureConfigured,
    };
    const ready =
      checks.database === "UP" &&
      (!env.requireAzureOpenAi || checks.azureOpenAiConfigured);

    if (!isHealthAuthorized(req)) {
      return res
        .status(401)
        .json({ status: "UNAUTHORIZED", timestamp: new Date() });
    }

    const payload = env.isProduction
      ? { status: ready ? "OK" : "DEGRADED", timestamp: new Date() }
      : {
          status: ready ? "OK" : "DEGRADED",
          env: env.nodeEnv,
          uptime: process.uptime(),
          checks,
          timestamp: new Date(),
        };

    return res.status(ready ? 200 : 503).json(payload);
  } catch (err) {
    return res
      .status(500)
      .json({ status: "ERROR", message: "Health check failed" });
  }
});

app.get("/health/ready", async (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  const azureConfigured = Boolean(
    env.azureOpenAiApiKey &&
      env.azureOpenAiEndpoint &&
      env.azureOpenAiDeployment
  );
  const ready = dbUp && (!env.requireAzureOpenAi || azureConfigured);

  if (!isHealthAuthorized(req)) {
    return res
      .status(401)
      .json({ status: "UNAUTHORIZED", timestamp: new Date() });
  }

  const payload = env.isProduction
    ? { ready, timestamp: new Date() }
    : {
        ready,
        database: dbUp ? "UP" : "DOWN",
        azureOpenAiConfigured: azureConfigured,
        timestamp: new Date(),
      };

  return res.status(ready ? 200 : 503).json(payload);
});

// ── Database connection (cached for serverless warm reuse) ────────────────────
let dbConnection = null;

async function connectToDatabase() {
  if (dbConnection && mongoose.connection.readyState === 1) {
    return dbConnection;
  }

  logger.info("mongodb_connecting");

  dbConnection = await mongoose.connect(env.mongoUri, {
    // Keep pool small — Azure Functions scales by spinning up more workers,
    // not by keeping a large pool per worker.
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
  });

  logger.info("mongodb_connected");

  return dbConnection;
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/hod", require("./routes/inviteRoutes"));
app.use("/api/hod", require("./routes/hodRoutes"));
app.use("/api/resume", require("./routes/resumeRoutes"));
app.use("/api/student", require("./routes/studentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/company", require("./routes/companyRoutes"));
app.use("/api/companies", require("./routes/companyRoutes"));
app.use("/api/placement", require("./routes/placementRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use(
  "/api/platform",
  authMiddleware,
  roleMiddleware([ROLES.PLATFORM_ADMIN]),
  require("./routes/platformRoutes")
);
app.use("/api/admin/report", require("./routes/reportAdminRoutes"));
app.use("/api/hod/report", require("./routes/reportHodRoutes"));
app.use("/api/principal", require("./routes/principalRoutes"));
app.use("/api/principal/report", require("./routes/reportPrincipalRoutes"));
app.use("/api/principal/reports", require("./routes/reportPrincipalRoutes"));
app.use("/api/placement/report", require("./routes/reportPlacementRoutes"));

// ── 404 & error handlers ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: "Route not found",
    requestId: req.requestId || null,
  });
});
app.use(errorHandler);

// ── DB readiness promise — exported for api/index.js ─────────────────────────
const appReady = connectToDatabase();

// Only start the HTTP server when running locally (not inside Azure Functions).
if (!isRunningInAzureFunctions) {
  appReady
    .then(() => {
      app.listen(env.port, () => {
        logger.info("server_started", {
          port: env.port,
          nodeEnv: env.nodeEnv,
          // Log resolved CORS origins so it's easy to verify correct
          // URLs are whitelisted on startup.
          corsOrigins: allowedOrigins,
        });
      });
    })
    .catch((err) => {
      logger.error("startup_failed", { message: err.message });
      process.exit(1);
    });
}

module.exports = app;
module.exports.appReady = appReady;