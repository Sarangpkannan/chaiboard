# 🫖 Chaiboard — Enterprise Campus Tea Leaderboard & Health Engine

Chaiboard turns the daily ritual of drinking cutting chai on college campuses into an engaging, gamified social leaderboard backed by a **Python backend**, a **SQLite relational database**, and a **multi-window desktop/web architecture**.

---

## 🏗️ Professional System Architecture

```
c:\Users\saran\Documents\new project\
├── app.py                  # High-performance async Python backend server (Tornado)
├── database.py             # SQLite3 relational database layer & SQL query engine
├── auth.py                 # PBKDF2 cryptographic password hashing & session management
├── health_engine.py        # Health metrics and humorous warning standards (PRD Section 4)
├── anti_cheat.py           # 64-bit perceptual hashing & Hamming distance validation (PRD Section 3)
├── chaiboard.db            # Persistent relational SQL database
├── tests/
│   └── test_backend.py     # Backend test suite (Auth, RBAC, Anti-cheat, Health Engine)
├── static/
│   ├── css/
│   │   └── style.css       # Dark glassmorphic chai aesthetic & responsive styles
│   └── js/
│       ├── audio.js        # Web Audio API procedural sound synthesizer
│       ├── three-chai.js   # Three.js 3D cutting glass WebGL renderer with slosh & steam
│       └── common.js       # Shared session & multi-window dock controller
└── templates/
    ├── login.html          # 🚪 Window 1: Student & Admin Sign In
    ├── register.html       # 📝 Window 1b: User Registration Portal
    ├── chamber.html        # 🫖 Window 2: 3D Cutting Glass & AI Live Logger
    ├── metrics.html        # 📊 Window 3: Health Engine & Nutrition Dashboard
    ├── leaderboard.html    # 🏆 Window 4: Student & Department Leaderboards
    ├── profile.html        # 🪪 Window 5: Digital Chai Pass & Verified Logs
    ├── audit.html          # 🛡️ Window 6: Anti-Cheat & Forensic Audit Vault
    └── admin.html          # 👑 Window 7: Master Administration & Settings Portal
```

---

## 🪟 Dedicated Multi-Window Functionality

Each core module has its own independent URL route and window. Using the global navigation dock, you can switch between them or click the **`↗`** button on any tab to launch that module into its own standalone desktop window:

| Dedicated Window | Route | Purpose |
| :--- | :--- | :--- |
| **Sign In** | [`/login`](http://localhost:5000/login) | Standard email & password sign-in (PBKDF2 salted hash). |
| **Registration** | [`/register`](http://localhost:5000/register) | Account creation with Full Name, Email, Department, and Password (no hostel block, no roll numbers). |
| **3D Chamber & Logger** | [`/chamber`](http://localhost:5000/chamber) | Full Three.js 3D Cutting Glass (slosh physics & steam FX), live camera feed, MobileNet object detection, and blend customization. |
| **Health Engine** | [`/metrics`](http://localhost:5000/metrics) | Real-time nutritional tracking (Calories, Sugar, Caffeine) with humorous warning thresholds and tongue thermal safety status. |
| **Campus Leaderboards** | [`/leaderboard`](http://localhost:5000/leaderboard) | SQL aggregations ranking individual students and Department Rivalries. |
| **Digital Chai Pass** | [`/profile`](http://localhost:5000/profile) | Printable official tea identity pass with student details, barcode, streak, and verified SQL history. |
| **Security Audit Vault** | [`/audit`](http://localhost:5000/audit) | Forensic audit trail recording 64-bit perceptual hashes (pHash), Hamming distances, and duplicate rejections. |
| **👑 Admin Portal** | [`/admin`](http://localhost:5000/admin) | Full control panel to manage all users, edit roles, reset passwords, configure global health engine limits, and inspect SQL database stats. |

---

## 🔑 Login Credentials

### 👑 Administrator Account (Full Control):
- **Email**: `admin@chaiboard.com`
- **Password**: `adminpassword123`
*(Logging in as Admin automatically surfaces the 👑 Admin Portal in the navigation dock).*

### 👨‍🎓 Sample Student Account:
- **Email**: `aarav@example.com`
- **Password**: `password123`
*(Or register any new account with any standard email address via the Register page).*

---

## 🗄️ Relational Database Schema (`chaiboard.db`)

1. **`students`**:
   - `id`, `name`, `email` (UNIQUE), `password_hash`, `salt`, `department`, `role` (`'student'` or `'admin'`), `avatar`, `created_at`
2. **`chai_logs`**:
   - `id`, `student_id` (FK), `blend_name`, `sugar_grams`, `calories_kcal`, `caffeine_mg`, `tongue_temp_c`, `phash_hex`, `phash_binary`, `mobilenet_confidence`, `logged_at`
3. **`fraud_audit_logs`**:
   - `id`, `student_id` (FK), `phash_hex`, `status`, `reason`, `hamming_distance`, `attempted_at`
4. **`sessions`**:
   - `token` (PK), `student_id` (FK), `created_at`, `expires_at`
5. **`app_settings`**:
   - `key` (PK), `value`, `updated_at` (Stores live engine thresholds and configuration)
