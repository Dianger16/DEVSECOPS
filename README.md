# CI/CD Pipeline with Security Scanning
### Stack: GitHub Actions + SonarQube (SAST) + OWASP ZAP (DAST)

> Project #13 from the DevOps + AI Project Sheet

---

## What This Does

```
Push code to GitHub
        │
        ▼
┌─────────────────────────────────────────────┐
│           GitHub Actions Pipeline            │
│                                             │
│  Job 1: Test + Coverage                     │
│    └─ Jest tests → lcov coverage report     │
│                                             │
│  Job 2: SAST — SonarQube        (parallel)  │
│    └─ Scans SOURCE CODE for:               │
│         Bugs, Vulnerabilities,              │
│         Code smells, Security hotspots      │
│    └─ Checks Quality Gate → PASS/FAIL       │
│                                             │
│  Job 3: DAST — OWASP ZAP        (parallel)  │
│    └─ Starts REAL app in Docker             │
│    └─ Scans RUNNING APP for:               │
│         XSS, SQLi, CSRF,                   │
│         Insecure headers, Open redirects    │
│    └─ Uploads HTML report as artifact       │
│                                             │
│  Job 4: Dependency Audit         (parallel) │
│    └─ npm audit for known CVEs              │
│                                             │
│  Job 5: Security Summary                    │
│    └─ Blocks deploy if SAST failed          │
└─────────────────────────────────────────────┘
```

---

## SAST vs DAST — Key Difference

| | SAST (SonarQube) | DAST (OWASP ZAP) |
|---|---|---|
| What it scans | Source code | Running application |
| When | Before build | After deploy |
| Finds | Code bugs, hardcoded secrets, bad patterns | Runtime vulnerabilities, HTTP attacks |
| Analogy | Proofreading a document | Trying to break into a building |

---

## Project Structure

```
devsecops/
├── app/
│   ├── index.js            → Express app with intentional vuln for demo
│   ├── index.test.js       → Jest tests with coverage
│   ├── package.json
│   └── Dockerfile
├── .github/workflows/
│   └── devsecops.yml       → Full 5-job security pipeline
├── .zap/
│   └── rules.tsv           → ZAP alert configuration
├── sonarqube/
│   └── sonar-project.properties → SonarQube config
├── scripts/
│   └── local_scan.sh       → Run full scan locally
├── docker-compose.yml      → SonarQube + app for local dev
└── README.md
```

---

## Setup

### Step 1 — Set up SonarQube Cloud (free)

1. Go to https://sonarcloud.io → Sign up with GitHub
2. Click **+** → **Analyze new project** → import your GitHub repo
3. Go to **Administration** → **Analysis Method** → **GitHub Actions**
4. Copy the `SONAR_TOKEN` shown

### Step 2 — Add GitHub Secrets

Go to your repo → Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `SONAR_TOKEN` | Token from SonarCloud |
| `SONAR_HOST_URL` | `https://sonarcloud.io` |

### Step 3 — Push and watch it run

```bash
git init
git add .
git commit -m "feat: DevSecOps pipeline with SAST + DAST"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/devsecops-demo.git
git push -u origin main
```

---

## What You'll See After First Run

**SonarQube will flag:**
- The `/search` endpoint reflecting unsanitized input (Security Hotspot)
- Any missing security headers

**OWASP ZAP will flag:**
- Missing Content Security Policy header
- Anti-CSRF token warnings
- Any reflected input vulnerabilities

This is intentional — it shows the scanners working. Fix the issues, push again, watch the pipeline go green.

---

## Local Scanning (No GitHub needed)

```bash
docker compose up -d
bash scripts/local_scan.sh
```

Open http://localhost:9000 for SonarQube dashboard.

---

## What This Demonstrates

| Skill | Evidence |
|---|---|
| SAST | SonarQube scanning source code, Quality Gate |
| DAST | OWASP ZAP scanning live app for runtime vulns |
| GitHub Actions | 5-job parallel pipeline with security gates |
| DevSecOps | Security built INTO the pipeline, not added after |
| npm audit | Dependency CVE scanning |
| Docker | App containerized for consistent DAST target |
| Security mindset | helmet.js, input validation, proper error handling |