require("dotenv").config();
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { env } = require("./config/env");
const { ROLES } = require("./constants/roles");
const { logger } = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger");
// const session = require("express-session"); // legacy (Google OAuth)
// const passport = require("./config/passport"); // legacy (Google OAuth)
const errorHandler = require("./middleware/errorHandler");
const requestSanitizer = require("./middleware/requestSanitizer");
const responseHardener = require("./middleware/responseHardener");
const { globalApiLimiter } = require("./middleware/rateLimiter");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const app = express();

// MIDDLEWARES
const allowedOrigins = env.corsAllowedOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const err = new Error("Not allowed by CORS")
      err.statusCode = 403
      err.code = "CORS_DENIED"
      callback(err)
    }
  },
  credentials: false
};

app.disable("x-powered-by");
if (env.trustProxy) app.set("trust proxy", 1)

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  hsts: env.isProduction
    ? { maxAge: 15552000, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: "no-referrer" },
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: env.jsonBodyLimit }));
app.use(express.urlencoded({ extended: false, limit: env.jsonBodyLimit }));
app.use(requestLogger);
app.use(responseHardener);
app.use("/api", globalApiLimiter);
app.use("/api", requestSanitizer);


// SESSION / PASSPORT (LEGACY - DISABLED)
//
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "platform_admin_session",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 5 * 60 * 1000,
//     },
//   })
// );
//
// app.use(passport.initialize());
// app.use(passport.session());


app.get("/", (req, res) => {
  res.json({ message: "STON Technology Backend Running" });
});

function isHealthAuthorized(req) {
  if (!env.isProduction) return true
  if (!env.healthCheckKey) return true
  return String(req.headers["x-health-check-key"] || "") === String(env.healthCheckKey)
}

app.get("/health", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState === 1 ? "UP" : "DOWN";
    const azureConfigured = Boolean(env.azureOpenAiApiKey && env.azureOpenAiEndpoint && env.azureOpenAiDeployment)
    const checks = {
      database: dbState,
      platformAdminConfigured: Boolean(env.platformAdminEmail),
      azureOpenAiConfigured: azureConfigured,
    }
    const ready = checks.database === "UP" && (!env.requireAzureOpenAi || checks.azureOpenAiConfigured)

    if (!isHealthAuthorized(req)) {
      return res.status(401).json({ status: "UNAUTHORIZED", timestamp: new Date() })
    }

    const payload = env.isProduction
      ? { status: ready ? "OK" : "DEGRADED", timestamp: new Date() }
      : { status: ready ? "OK" : "DEGRADED", env: env.nodeEnv, uptime: process.uptime(), checks, timestamp: new Date() }

    res.status(ready ? 200 : 503).json(payload);
  } catch (err) {
    res.status(500).json({
      status: "ERROR",
      message: "Health check failed",
    });
  }
});

app.get("/health/ready", async (req, res) => {
  const dbUp = mongoose.connection.readyState === 1
  const azureConfigured = Boolean(env.azureOpenAiApiKey && env.azureOpenAiEndpoint && env.azureOpenAiDeployment)
  const ready = dbUp && (!env.requireAzureOpenAi || azureConfigured)
  if (!isHealthAuthorized(req)) {
    return res.status(401).json({ status: "UNAUTHORIZED", timestamp: new Date() })
  }

  const payload = env.isProduction
    ? { ready, timestamp: new Date() }
    : { ready, database: dbUp ? "UP" : "DOWN", azureOpenAiConfigured: azureConfigured, timestamp: new Date() }

  return res.status(ready ? 200 : 503).json(payload)
})

// Start server only after MongoDB is connected so session/User queries don't buffer and time out.
mongoose
  .connect(env.mongoUri)
  .then(() => {
    logger.info("mongodb_connected");

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
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Route not found",
        requestId: req.requestId || null,
      })
    })
    app.use(errorHandler);
    return app.listen(env.port);
  })
  .then((server) => {
    logger.info("server_started", {
      port: env.port,
      nodeEnv: env.nodeEnv,
      corsOrigins: allowedOrigins,
      requireAzureOpenAi: env.requireAzureOpenAi,
      inviteExpiryHours: env.inviteExpiryHours,
      defaultCollegeDepartmentLimit: env.defaultCollegeDepartmentLimit,
    });
  })
  .catch((err) => {
    logger.error("mongodb_connection_failed", { message: err.message });
    process.exit(1);
  });
