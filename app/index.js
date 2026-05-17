const express = require("express");
const helmet  = require("helmet");
const app     = express();
const PORT    = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || "1.0.0";

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());                          // sets secure HTTP headers
app.use(express.json({ limit: "10kb" }));   // limit body size

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status:  "ok",
    version: VERSION,
    message: "DevSecOps Demo App",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", version: VERSION });
});

// ── Intentional vulnerability for SAST demo ───────────────────────────────────
// SonarQube will flag this — shows the scanner working
app.get("/search", (req, res) => {
  const query = req.query.q;
  // VULNERABILITY: unsanitized input reflected in response
  // SonarQube flags this as: "Make sure that this content is sanitized"
  res.json({ query: query, results: [] });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`App v${VERSION} running on port ${PORT}`);
});

module.exports = { app, server };