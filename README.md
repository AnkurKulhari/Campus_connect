# 🎓 CampusConnect — College-Exclusive Social Network

CampusConnect is an exclusive social network built specifically for college students. Account registration is restricted to verified student emails (`@ipec.org.in`), ensuring an authentic campus community.

---

## ✨ Features

- **College-Exclusive Auth**: Verified registration scoped to `@ipec.org.in` numeric roll-number emails with 6-digit OTP verification and password reset flows.
- **Campus & Following Feeds**: Dual-tab feed allowing students to view the campus-wide pulse or only posts from peers they follow.
- **Rich Multimedia Posts**: Text and multi-image uploads powered by Cloudinary CDN with natural aspect-ratio previews and full-resolution lightbox views.
- **Social Core**: Optimistic like toggling, threaded comment discussions, edit & delete capabilities.
- **Campus Hashtags**: Auto-detected interactive `#hashtags` with click-to-filter feed navigation and trending topics sidebar.
- **Student Profiles**: Editable bios, custom profile picture uploads, follower/following counts, and post archives.
- **Safety & Moderation**:
  - **Automated Text Filter**: De-obfuscates leetspeak and blocks 18+ adult terms.
  - **Visual AI Moderation**: Local ONNX visual nudity detection before cloud storage.
  - **Community Reporting**: Peer reporting with automatic quarantine once a post receives 2+ reports.
- **Notifications**: Instant alerts for likes, comments, and new followers with unread count badges.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.13)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/)
- **Authentication**: JWT (JSON Web Tokens) with Argon2 password hashing
- **Media Storage**: [Cloudinary](https://cloudinary.com/) CDN
- **Content Safety**: NudeNet (YOLOv8 ONNX) + Text Normalization Filter

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL running locally on port 5432

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials, JWT secret, and Cloudinary keys

# Run database migrations
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API docs available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔒 Security Best Practices
- Passwords hashed using Argon2id.
- Rate-limiting and cooldown timers on OTP dispatch.
- CORS restricted to allowed web origins.
- Sensitive environment variables excluded from source control.
