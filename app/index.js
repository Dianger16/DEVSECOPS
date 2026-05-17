const express = require("express");
const helmet  = require("helmet");

const app     = express();
const PORT    = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || "1.0.0";

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet()); // sets secure HTTP headers

// Add Content Security Policy (helps fix OWASP ZAP warnings)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  })
);

app.use(express.json({ limit: "10kb" })); // limit body size

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    version: VERSION,
    message: "DevSecOps Demo App",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    version: VERSION,
  });
});

// ── OLD Vulnerable Route (kept for demo/reference) ───────────────────────────
// SonarQube flagged this because user input was reflected directly
// without sanitization.
//
// app.get("/search", (req, res) => {
//   const query = req.query.q;
//
//   // ❌ Vulnerability:
//   // unsanitized input reflected in response
//   res.json({
//     query: query,
//     results: [],
//   });
// });

// ── FIXED Secure Route ────────────────────────────────────────────────────────
app.get("/search", (req, res) => {
  const query = req.query.q || "";

  // ✅ Sanitize input:
  // allow only letters, numbers, and spaces
  const sanitized = query
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .slice(0, 100);

  res.json({
    query: sanitized,
    results: [],
  });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    error: "Internal server error",
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`App v${VERSION} running on port ${PORT}`);
});

module.exports = { app, server };