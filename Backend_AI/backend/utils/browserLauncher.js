"use strict";

// PDF generation via Chromium is temporarily disabled.
// @sparticuz/chromium is incompatible with Azure Functions (binary compiled
// for AWS Lambda) and exceeds the 100MB SWA deployment zip limit.
// TODO: Replace with pdfkit/pdf-lib implementation.

async function getBrowser() {
  throw new Error(
    "PDF generation is temporarily disabled in this environment."
  );
}

module.exports = { getBrowser };