"""
Chaiboard Authentication & Security Subsystem
PBKDF2 Password Hashing, Session Management, and Role Verification.
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
import database

ITERATIONS = 100000

def hash_password(password: str) -> tuple[str, str]:
    salt = secrets.token_bytes(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, ITERATIONS)
    return pwd_hash.hex(), salt.hex()

def verify_password(password: str, stored_hash: str, stored_salt: str) -> bool:
    salt = bytes.fromhex(stored_salt)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, ITERATIONS)
    return secrets.compare_digest(pwd_hash.hex(), stored_hash)

def register_student(name: str, email: str, password: str, dept: str, avatar: str = '☕', role: str = 'student'):
    email_clean = email.strip().lower()
    if '@' not in email_clean or '.' not in email_clean or len(email_clean) < 5:
        return False, "Please enter a valid email address."

    if len(password) < 4:
        return False, "Password must be at least 4 characters."

    existing = database.get_student_by_email(email_clean)
    if existing:
        return False, f"An account with email '{email_clean}' is already registered."

    pwd_hash, salt = hash_password(password)
    student_id = database.create_student(name.strip(), email_clean, pwd_hash, salt, dept, avatar, role)
    if not student_id:
        return False, "Failed to create user record in SQL database."

    return True, student_id

def authenticate_student(email: str, password: str):
    email_clean = email.strip().lower()
    student = database.get_student_by_email(email_clean)
    if not student:
        return None, "No registered account found with this email."

    if not verify_password(password, student['password_hash'], student['salt']):
        return None, "Invalid password credentials."

    # Generate cryptographically secure session token
    token = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    database.create_session(token, student['id'], expires_at)

    return {
        'token': token,
        'student': {
            'id': student['id'],
            'name': student['name'],
            'email': student['email'],
            'department': student['department'],
            'role': student.get('role', 'student'),
            'avatar': student['avatar']
        }
    }, None
