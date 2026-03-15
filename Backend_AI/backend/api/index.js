"use strict";

const serverless = require("serverless-http");

// Importing the module starts the DB connection promise (connectToDatabase is
// called at module load time inside server.js).  We grab both the app and the
// readiness promise in a single require so Node's module cache is only hit once.
const app = require("../server");
const { appReady } = require("../server");

// Lazily created — reused across warm invocations.
let handler = null;

/**
 * Azure Functions v3 entry point.
 *
 * Execution flow:
 *  1. Await the DB readiness promise (no-op on warm invocations — Promise is
 *     already resolved).
 *  2. Create the serverless-http handler once and cache it.
 *  3. Forward the Azure Functions (context, req) pair to the handler and
 *     return its result.
 */
module.exports = async function azureFunctionHandler(context, req) {
  const originalLog = context.log;

  try {
    // Block until MongoDB is connected.  On cold start this may take a moment;
    // on warm invocations it resolves instantly because the Promise is already
    // settled.
    await appReady;

    if (!handler) {
      handler = serverless(app, { provider: "azure" });
    }

    // serverless-http's Azure provider calls context.log(response) internally,
    // which produces a noisy ServerResponse object dump.  Suppress it while
    // keeping all other logging intact.
    context.log = function (...args) {
      if (
        args[0] &&
        typeof args[0] === "object" &&
        args[0].constructor &&
        args[0].constructor.name === "ServerResponse"
      ) {
        return;
      }
      originalLog.apply(context, args);
    };

    return await handler(context, req);
  } catch (err) {
    // Log with the original context.log so we always see startup / handler
    // errors in Azure Monitor regardless of the suppression patch above.
    originalLog.call(context, "AzureFunctionHandler error:", {
      message: err.message,
      stack: err.stack,
      code: err.code || null,
    });

    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      }),
    };
  } finally {
    // Always restore the original logger — even if the handler threw.
    context.log = originalLog;
  }
};