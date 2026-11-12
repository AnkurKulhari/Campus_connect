# AGENTS.md — CampusConnect Engineering & Security Protocol

> **MANDATORY INSTRUCTION FOR ALL AI CODING AGENTS & COLLABORATORS**
> 
> This document defines the **obligatory security audit checklist and design excellence standards** for the CampusConnect codebase. 
> 
> **Every agent working on this repository MUST inspect and verify every applicable gate in this document BEFORE staging any `git commit` and BEFORE triggering any production deployment (`git push origin main`).**
> 
> *Framework Sources*:
> - Security Architecture: [Cloudflare Security Audit Skill](https://github.com/cloudflare/security-audit-skill) (Multi-Phase Verification, Trust Boundaries, Attack Classes, and Zero-Dependency Proofs).
> - UI/UX Architecture: [Impeccable Design System](https://github.com/pbakaus/impeccable) (Anti-Slop Directives, High-Contrast Accessibility, Purposeful Spatial Hierarchy, and Responsive Ergonomics).

---

## 1. System Architecture & Trust Boundaries

CampusConnect is a college-exclusive social network reserved exclusively for verified students and alumni of **Inderprastha Engineering College (`@ipec.org.in`)**.

```
[ Public Internet / Unauthenticated Visitor ]
                   │
                   ▼  (Trust Boundary 1: Campus Wall)
┌────────────────────────────────────────────────────────┐
│  Next.js AuthGuard (Redirects unauthenticated to /login)│
│  Public Endpoints: /login, /register, /forgot-password │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼  (Trust Boundary 2: Enrollment Verification)
┌────────────────────────────────────────────────────────┐
│  FastAPI Backend (/auth)                                │
│  - Academic Roll Number Verification (IPEC Formula)    │
│  - OCR Name Matching on Uploaded ID Card               │
│  - Ephemeral In-Memory ID Cache (id_cache.py)          │
│  - Bilingual Profanity Engine (moderation.py)          │
│  - Server-Side IP Rate Limiting (rate_limiter.py)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼  (Trust Boundary 3: Verified Student Access)
┌────────────────────────────────────────────────────────┐
│  Authenticated Session (JWT HS256 + Argon2id Passwords)│
│  - Timeline Feed & Posts                               │
│  - Alumni Circle Directory                             │
│  - Direct Messaging & Real-Time Notifications          │
│  - Cloudinary Storage (Deferred Upload post-OTP only)  │
└────────────────────────────────────────────────────────┘
```

### The 5 Hard Trust Boundaries
1. **The Campus Wall**: Unauthenticated visitors must **never** receive post feeds, peer lists, or internal dashboard data. Next.js `<AuthGuard>` must intercept any attempt to access internal routes.
2. **The Ephemeral Ingress Boundary**: Unverified users must **never** be granted direct access or upload privileges to permanent cloud infrastructure (Cloudinary). All pre-verification artifacts (e.g. ID card scans) must live only in ephemeral server-side memory cache with strict TTLs ($\le 15$ minutes).
3. **The Academic Domain Boundary**: All account creation, login, and password resets must be strictly bound to `@ipec.org.in` with a 13-digit numeric AKTU roll number. Generic email domains (`gmail.com`, `yahoo.com`, etc.) must be rejected with HTTP 400.
4. **The Author Privilege Boundary (IDOR Guard)**: Any write, edit, or delete action on a resource (post, comment, message, profile) must check authorization against the database row owner (`resource.user_id == current_user.id`).
5. **The Content Safety Boundary**: Every piece of student-submitted text (name, username, bio, post, comment, message) and image must pass automated bilingual profanity filtering and nudity detection before DB persistence.

---

## 2. Cloudflare Security Audit Checklist (Attack Classes & Edge Cases)

Before committing any backend or frontend code, evaluate each attack class:

### Class 1: Authentication & Identity Assurance
- [ ] **IPEC Formula & College Domain Check**: Does every email parameter go through `validate_email(email)`? Does it strictly reject non-IPEC domains, leading/trailing spaces, and invalid roll numbers? Must enforce either a 13-digit AKTU roll number with IPEC institute code `0030` or 10-digit legacy alumni roll number with code `030`.
- [ ] **Anti-Response-Tampering Defense (Proxy Rewriting Guard)**: Does `/auth/verify-email` return a cryptographic signed JWT access token and user payload upon success? Does the client verify `data.status === "success"` and `data.access_token` rather than blindly relying on HTTP status code `200` to prevent proxy status manipulation (e.g., Burp Suite rewriting `400/401` to `200 OK`)?
- [ ] **OTP Brute-Force Defense**: Does the OTP verification record enforce `MAX_OTP_ATTEMPTS = 5` and immediately purge the pending record upon reaching the limit?
- [ ] **OTP Resend Cooldown**: Is a minimum 60-second database-backed cooldown (`last_otp_sent_at`) enforced before dispatching another email?
- [ ] **Squatting Guard**: If a username is reserved in `PendingRegistration`, does it expire and release after 10 minutes so legitimate students are not locked out?
- [ ] **Password Security**: Are passwords hashed using Argon2id (`argon2-cffi`)? Does the validator enforce length ($\ge 8$), uppercase, lowercase, numbers, and special characters?
- [ ] **JWT Invariants**: Are JWT tokens cryptographically signed (`HS256`) using `settings.SECRET_KEY`? Does `get_current_user` verify the subject ID against the database?

### Class 2: Data Isolation & PII Protection
- [ ] **Zero Cloudinary Leakage Before OTP**: Is the student ID card held strictly in server-side memory cache (`id_cache.py`) prior to email verification?
  - Verify that `/auth/upload-id-card` returns an opaque `temp_token` (`temp_id_...`) and **never** a public Cloudinary CDN URL.
  - Verify that `upload_media_bytes` is invoked **only** inside `verify_email_service` after the 6-digit OTP is validated.
- [ ] **Privacy of Academic Year-Back**: Is `is_year_back` restricted to administrative calculations and profile self-view (`is_self`)? It must **never** be rendered publicly to classmates.
- [ ] **Direct Message Privacy**: Are direct messages filtered strictly by participant ID (`or_(sender_id == current_user.id, recipient_id == current_user.id)`)?
- [ ] **Notification Isolation**: Can a student only list and mark notifications where `recipient_id == current_user.id`?

### Class 3: Content Moderation & Safety Pipeline
- [ ] **Bilingual Profanity Coverage**: Does `assert_safe_content` check both Hindi/Hinglish cuss words (`lund`, `chut`, `raand`, `bhosdike`, `gaand`, `madarchod`, `behenchod`, `harami`, `kameena`, `kutta`, `chus`, `chod`, etc.) and English vulgarities (`fuck`, `bitch`, `cunt`, `asshole`, `dick`, `pussy`, `nigger`, etc.)?
- [ ] **Deobfuscation Checks**:
  - Leetspeak translation (`@` $\to$ `a`, `0` $\to$ `o`, `1` $\to$ `i`, `$` $\to$ `s`, `3` $\to$ `e`, `7` $\to$ `t`).
  - Delimiter and snake_case tokenization (`chut_ka_saudagar` $\to$ `['chut', 'ka', 'saudagar']`).
  - Repeated character reduction (`chuuuut` $\to$ `chut`, `fuuuuck` $\to$ `fuck`).
  - Condensed concatenation check (`chutkasaudagar`, `ankurraand`).
- [ ] **Safety on All Ingress Vectors**: Is `assert_safe_content` called on:
  - Registration: `full_name` and `username`.
  - Profile Update: `full_name` and `bio`.
  - Posts: `post_data.content`.
  - Comments & Replies: `comment_data.content`.
  - Direct Messages: `content`.
- [ ] **Automated ID Card OCR Verification**:
  - Does `/auth/upload-id-card` run `verify_id_card_name` using Tesseract OCR with grayscale/contrast enhancement?
  - Does it verify that student name tokens or roll number appear on the uploaded card image?
  - Does it gracefully handle host environments without hard crashing?

### Class 4: Resource Exhaustion, Availability & Rate Limiting
- [ ] **Server-Side IP Rate Limiting**: Does `rate_limiter.py` guard all public auth routes?
  - `register`: Max 10 attempts per IP per 10 minutes.
  - `upload-id-card`: Max 8 attempts per IP per 5 minutes.
  - `forgot-password`: Max 5 attempts per IP per 10 minutes.
  - `resend-otp`: Max 5 attempts per IP per 10 minutes.
  - `login`: Max 20 attempts per IP per 5 minutes.
- [ ] **File Size Enforcement**:
  - Images: Max 10MB (`MAX_IMAGE_SIZE_MB`).
  - Videos: Max 50MB (`MAX_VIDEO_SIZE_MB`).
- [ ] **Database Pagination**: Are all listing endpoints bounded (`limit <= 50`, `page >= 1`)? Never allow unbounded queries (`.all()` without `limit`).

### Class 5: Client-Side Security & Media Shielding
- [ ] **Media Download Protection**: Are images and videos protected via `globals.css` with `-webkit-touch-callout: none`, `user-select: none`, `-webkit-user-drag: none`, and right-click interceptors?
- [ ] **Client Token Hygiene**: When an API call returns `401 Unauthorized`, does `api.ts` immediately call `removeToken()` and purge both `localStorage` and `document.cookie`?
- [ ] **XSS Sanitization**: Are user-provided URLs (e.g. LinkedIn profiles) validated to start with `https://linkedin.com/` before rendering?

---

## 3. Impeccable Design System Standards (Anti-Slop Directives)

CampusConnect interfaces must look and feel handcrafted, high-contrast, robust, and purposeful. Avoid generic "AI Slop" defaults.

### 1. Typography & Hierarchy
- **Primary Typeface**: Apple System / Segoe UI / Roboto system stack with `-0.01em` letter spacing for clean legibility without web-font loading lag.
- **Roll Numbers & OTPs**: Always use `font-mono tracking-widest` or `font-mono tracking-[0.5em]` for numbers, codes, and roll numbers.
- **Headings**: Use bold, deliberate weights (`font-extrabold tracking-tight`). Never use timid thin serifs or generic AI-default styling.

### 2. Color, Contrast & Accessibility
- **Light Theme**:
  - Canvas: `#F8FAFC` (Clean slate-50).
  - Cards: `#FFFFFF` with border `#E2E8F0` / `slate-200/80`.
  - Text: `#0F172A` (Crisp slate-900). **Never use low-contrast washed-out grays.**
- **Dark Theme**:
  - Canvas: `#0B0F19` (Midnight navy).
  - Cards: `#131B2E` with border `#1E293B` / `slate-800`.
  - Text: `#F8FAFC` (Pure crisp text).
- **Brand Palette**:
  - Primary Action: `#2563EB` (Royal Blue) $\to$ Hover `#1D4ED8`.
  - Verification & Badges: `#10B981` (Emerald) for verified students, `#F59E0B` (Amber) for warnings/notices.
- **No Purple Slop**: Never use generic purple-to-pink AI gradient defaults. Use purposeful deep navy blooms or campus blue glows.

### 3. Spatial Hierarchy & Card Layout
- **No Cards Inside Cards**: Maintain flat, spatial hierarchy. Use subtle border dividers (`border-slate-100 dark:border-slate-800/80`) rather than nesting boxes inside boxes.
- **Breathing Room**: Inputs must have generous padding (`px-3.5 py-2.5` minimum). Form buttons must have `py-3.5` with rounded-2xl radii.
- **Mobile Ergonomics**: All interactive tap targets must measure $\ge 44 \times 44$px.

### 4. Motion, Feedback & UX Writing
- **Live State Feedback**: Buttons must indicate their exact live operation (`Verifying ID & Sending OTP...`, `Checking email...`, `Sending...`).
- **Campus-Native Copy**: Use authentic college student language:
  - *"IPEC Campus Exclusive"*
  - *"Roll Number & ID Verified"*
  - *"Connect exclusively with verified IPEC classmates and alumni"*
- **Error Messages**: Provide actionable remediation (e.g. *"Must end with @ipec.org.in starting with your numeric roll number"*), not generic *"Error"*.

---

## 4. Pre-Commit Verification Gate

Before running `git commit`, the agent MUST run and pass this exact 5-step pipeline:

```bash
# Step 1: Backend Type & Syntax Sanity Check
cd /Users/anilkumar/PycharmProjects/Campus_connect/backend
.venv/bin/python -m py_compile app/main.py app/routers/*.py app/services/*.py app/utils/*.py

# Step 2: Run Automated Moderation & Security Tests
.venv/bin/python -c "
from app.utils.moderation import is_explicit_text, assert_safe_content
from app.utils.id_verification import verify_id_card_name
assert is_explicit_text('chut_ka_saudagar')[0] == True
assert is_explicit_text('Ankur raand')[0] == True
assert is_explicit_text('Mera lund chus lo')[0] == True
assert is_explicit_text('Ankur Kulhari')[0] == False
print('Security Assertion Suite: PASSED')
"

# Step 3: Frontend TypeScript & Turbopack Production Build
cd /Users/anilkumar/PycharmProjects/Campus_connect/frontend
npm run build

# Step 4: Verify No Secrets in Git Working Tree
git status
# Confirm .env files, private keys, or credentials are NOT staged.

# Step 5: Verify Local Backend Health
curl -s http://127.0.0.1:8000/health | grep '"status":"ok"'
```

---

## 5. Production Push & Deployment Verification Gate

Before running `git push origin main`, verify:
1. `backend/Dockerfile` includes all native dependencies (`tesseract-ocr`, `tesseract-ocr-eng`, `libgl1`, `libglib2.0-0`).
2. `backend/requirements.txt` is updated with all new libraries.
3. Railway production backend health check passes:
   ```bash
   curl -s https://campusconnect-production-d75bdcf7.up.railway.app/health
   # Expected output: {"status":"ok","database":"connected"}
   ```
4. Vercel frontend production deployment builds with 13/13 static/dynamic routes.
5. All security issues documented in this protocol are verified non-regressive.
