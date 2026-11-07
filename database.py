"""
Chaiboard Database Layer (SQLite3 with Pure SQL)
Handles relational persistence, foreign keys, aggregations, and admin management.
"""

import sqlite3
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), 'chaiboard.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Students Table (Email + Department, Role for Admin, No hostel, No roll number)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        department TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student', -- 'student' or 'admin'
        avatar TEXT DEFAULT '☕',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Chai Logs Table (Cup blend, Nutrition, pHash fingerprints, Temperature)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chai_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        blend_name TEXT NOT NULL,
        sugar_grams REAL NOT NULL,
        calories_kcal REAL NOT NULL,
        caffeine_mg REAL NOT NULL,
        tongue_temp_c REAL NOT NULL,
        phash_hex TEXT NOT NULL,
        phash_binary TEXT NOT NULL,
        mobilenet_confidence REAL NOT NULL,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    # 3. Fraud & Anti-Cheat Audit Logs (Perceptual Hash History & Fraud Rejections)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fraud_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        phash_hex TEXT NOT NULL,
        status TEXT NOT NULL, -- 'VERIFIED_AUTHENTIC', 'REJECTED_DUPLICATE', 'REJECTED_NON_TEA'
        reason TEXT NOT NULL,
        hamming_distance INTEGER,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
    );
    """)

    # 4. Active Sessions Table (Token authentication)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        student_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    # 5. Global Application Settings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Indexes for performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_student_email ON students(email);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_student ON chai_logs(student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_date ON chai_logs(logged_at);")

    # Default Settings
    defaults = {
        'threshold_calories': '250.0',
        'threshold_sugar': '30.0',
        'threshold_caffeine': '150.0',
        'anti_cheat_hamming_min': '5',
        'tapri_name': 'Central Campus Tapri',
        'allow_registration': 'true'
    }
    for k, v in defaults.items():
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?);", (k, v))

    conn.commit()
    conn.close()

# --- Student Queries ---
def create_student(name, email, password_hash, salt, department, avatar='☕', role='student'):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO students (name, email, password_hash, salt, department, avatar, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, email.strip().lower(), password_hash, salt, department, avatar, role))
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_student_by_email(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE email = ?", (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_student_by_id(student_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, department, role, avatar, created_at FROM students WHERE id = ?", (student_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# --- Session Management ---
def create_session(token, student_id, expires_at):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sessions (token, student_id, expires_at)
        VALUES (?, ?, ?)
    """, (token, student_id, expires_at))
    conn.commit()
    conn.close()

def get_student_from_session(token):
    if not token:
        return None
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.id, s.name, s.email, s.department, s.role, s.avatar, s.created_at
        FROM sessions sess
        JOIN students s ON sess.student_id = s.id
        WHERE sess.token = ? AND sess.expires_at > CURRENT_TIMESTAMP
    """, (token,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_session(token):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# --- Logging & Anti-Cheat Queries ---
def get_recent_hashes_12h(student_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT phash_binary, phash_hex, logged_at
        FROM chai_logs
        WHERE student_id = ? AND logged_at >= datetime('now', '-12 hours')
    """, (student_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def insert_chai_log(student_id, blend_name, sugar_grams, calories_kcal, caffeine_mg, tongue_temp_c, phash_hex, phash_binary, mobilenet_confidence):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO chai_logs (student_id, blend_name, sugar_grams, calories_kcal, caffeine_mg, tongue_temp_c, phash_hex, phash_binary, mobilenet_confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (student_id, blend_name, sugar_grams, calories_kcal, caffeine_mg, tongue_temp_c, phash_hex, phash_binary, mobilenet_confidence))
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return log_id

def insert_audit_log(student_id, phash_hex, status, reason, hamming_dist=None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO fraud_audit_logs (student_id, phash_hex, status, reason, hamming_distance)
        VALUES (?, ?, ?, ?, ?)
    """, (student_id, phash_hex, status, reason, hamming_dist))
    conn.commit()
    conn.close()

# --- Metrics & Aggregations ---
def get_student_metrics(student_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            COUNT(*) as cups_today,
            COALESCE(SUM(calories_kcal), 0) as calories_today,
            COALESCE(SUM(sugar_grams), 0) as sugar_today,
            COALESCE(SUM(caffeine_mg), 0) as caffeine_today,
            COALESCE(AVG(tongue_temp_c), 65) as avg_temp
        FROM chai_logs
        WHERE student_id = ? AND date(logged_at) = date('now')
    """, (student_id,))
    today_stats = dict(cursor.fetchone())

    cursor.execute("""
        SELECT COUNT(*) as all_time_cups
        FROM chai_logs
        WHERE student_id = ?
    """, (student_id,))
    all_time = cursor.fetchone()['all_time_cups']

    cursor.execute("""
        SELECT COUNT(*) as weekly_cups
        FROM chai_logs
        WHERE student_id = ? AND logged_at >= datetime('now', '-7 days')
    """, (student_id,))
    weekly = cursor.fetchone()['weekly_cups']

    cursor.execute("""
        SELECT DISTINCT date(logged_at) as log_date
        FROM chai_logs
        WHERE student_id = ?
        ORDER BY log_date DESC
    """, (student_id,))
    dates = [r['log_date'] for r in cursor.fetchall()]

    streak = len(dates)
    conn.close()

    return {
        **today_stats,
        'all_time_cups': all_time,
        'weekly_cups': weekly,
        'streak': max(1, streak) if all_time > 0 else 0
    }

def get_student_chai_history(student_id, limit=20):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, blend_name, sugar_grams, calories_kcal, caffeine_mg, tongue_temp_c, phash_hex, mobilenet_confidence, logged_at
        FROM chai_logs
        WHERE student_id = ?
        ORDER BY logged_at DESC
        LIMIT ?
    """, (student_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- Leaderboard SQL Aggregations ---
def get_students_leaderboard(tier='daily'):
    conn = get_connection()
    cursor = conn.cursor()

    if tier == 'daily':
        date_filter = "date(l.logged_at) = date('now')"
    elif tier == 'weekly':
        date_filter = "l.logged_at >= datetime('now', '-7 days')"
    else:
        date_filter = "1=1"

    cursor.execute(f"""
        SELECT 
            s.id,
            s.name,
            s.email,
            s.department,
            s.avatar,
            COUNT(l.id) as cups_count,
            COALESCE(SUM(l.calories_kcal), 0) as total_cals,
            COALESCE(SUM(l.sugar_grams), 0) as total_sugar
        FROM students s
        LEFT JOIN chai_logs l ON s.id = l.student_id AND {date_filter}
        GROUP BY s.id
        ORDER BY cups_count DESC, s.name ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_departments_leaderboard():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            s.department,
            COUNT(DISTINCT s.id) as student_count,
            COUNT(CASE WHEN date(l.logged_at) = date('now') THEN l.id END) as cups_today,
            COUNT(l.id) as all_time_cups
        FROM students s
        LEFT JOIN chai_logs l ON s.id = l.student_id
        GROUP BY s.department
        ORDER BY cups_today DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_audit_logs(limit=40):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            a.id,
            a.phash_hex,
            a.status,
            a.reason,
            a.hamming_distance,
            a.attempted_at,
            s.name as student_name,
            s.email as student_email
        FROM fraud_audit_logs a
        LEFT JOIN students s ON a.student_id = s.id
        ORDER BY a.attempted_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- Admin Management API Queries ---
def get_all_students_admin():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            s.id,
            s.name,
            s.email,
            s.department,
            s.role,
            s.avatar,
            s.created_at,
            COUNT(l.id) as total_cups_logged
        FROM students s
        LEFT JOIN chai_logs l ON s.id = l.student_id
        GROUP BY s.id
        ORDER BY s.id ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_student_admin(student_id, name, email, department, role):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE students
            SET name = ?, email = ?, department = ?, role = ?
            WHERE id = ?
        """, (name.strip(), email.strip().lower(), department.strip(), role.strip(), student_id))
        conn.commit()
        return True, "User updated successfully."
    except sqlite3.IntegrityError:
        return False, "Email already in use by another account."
    finally:
        conn.close()

def delete_student_admin(student_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
    conn.commit()
    conn.close()
    return True

def reset_student_password_admin(student_id, new_password_hash, new_salt):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE students
        SET password_hash = ?, salt = ?
        WHERE id = ?
    """, (new_password_hash, new_salt, student_id))
    conn.commit()
    conn.close()
    return True

def get_all_settings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM app_settings")
    rows = cursor.fetchall()
    conn.close()
    return {r['key']: r['value'] for r in rows}

def update_setting(key, value):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    """, (key, str(value)))
    conn.commit()
    conn.close()

def get_system_stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total_users FROM students;")
    users = cursor.fetchone()['total_users']

    cursor.execute("SELECT COUNT(*) as total_cuttings FROM chai_logs;")
    cuttings = cursor.fetchone()['total_cuttings']

    cursor.execute("SELECT COUNT(*) as total_audits, COUNT(CASE WHEN status != 'VERIFIED_AUTHENTIC' THEN 1 END) as rejected_frauds FROM fraud_audit_logs;")
    fraud_row = cursor.fetchone()

    db_size = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
    conn.close()

    return {
        'total_users': users,
        'total_cuttings': cuttings,
        'total_audits': fraud_row['total_audits'],
        'rejected_frauds': fraud_row['rejected_frauds'],
        'db_size_kb': round(db_size / 1024, 1)
    }
