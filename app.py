"""
Chaiboard Professional Web Application Server
Powered by Python & Tornado with SQLite3 Relational Database.
Features multi-window architecture, PBKDF2 student & admin auth, and anti-cheat validation.
"""

import json
import os
import random
import tornado.ioloop
import tornado.web

import database
import auth
import health_engine
import anti_cheat

PORT = int(os.environ.get("PORT", 5050))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class BaseHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        token = self.get_cookie("chaiboard_session")
        if not token:
            auth_header = self.request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[7:].strip()
        if not token:
            return None
        return database.get_student_from_session(token)

    def write_json(self, data, status_code=200):
        self.set_status(status_code)
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps(data))

# --- Multi-Window Page Handlers ---

class RootHandler(BaseHandler):
    def get(self):
        if self.current_user:
            self.redirect('/chamber')
        else:
            self.redirect('/login')

class LoginViewHandler(BaseHandler):
    def get(self):
        self.render(os.path.join(BASE_DIR, 'templates', 'login.html'))

class RegisterViewHandler(BaseHandler):
    def get(self):
        self.render(os.path.join(BASE_DIR, 'templates', 'register.html'))

class ChamberWindowHandler(BaseHandler):
    def get(self):
        if not self.current_user:
            self.redirect('/login')
            return
        self.render(os.path.join(BASE_DIR, 'templates', 'chamber.html'))

class MetricsWindowHandler(BaseHandler):
    def get(self):
        if not self.current_user:
            self.redirect('/login')
            return
        self.render(os.path.join(BASE_DIR, 'templates', 'metrics.html'))

class LeaderboardWindowHandler(BaseHandler):
    def get(self):
        if not self.current_user:
            self.redirect('/login')
            return
        self.render(os.path.join(BASE_DIR, 'templates', 'leaderboard.html'))

class ProfileWindowHandler(BaseHandler):
    def get(self):
        if not self.current_user:
            self.redirect('/login')
            return
        self.render(os.path.join(BASE_DIR, 'templates', 'profile.html'))

class AuditWindowHandler(BaseHandler):
    def get(self):
        if not self.current_user:
            self.redirect('/login')
            return
        self.render(os.path.join(BASE_DIR, 'templates', 'audit.html'))

class AdminWindowHandler(BaseHandler):
    def get(self):
        user = self.current_user
        if not user or user.get('role') != 'admin':
            self.redirect('/login')
            return
        self.render(os.path.join(BASE_DIR, 'templates', 'admin.html'))

# --- REST API Handlers ---

class RegisterApiHandler(BaseHandler):
    def post(self):
        try:
            body = json.loads(self.request.body.decode('utf-8'))
            name = body.get('name', '').strip()
            email = body.get('email', '').strip()
            department = body.get('department', '').strip()
            password = body.get('password', '')

            if not name or not email or not password:
                self.write_json({'error': 'All fields are required.'}, 400)
                return

            avatars = ['☕', '🫖', '⚡', '🧬', '🚀', '🌟']
            avatar = random.choice(avatars)

            ok, msg = auth.register_student(name, email, password, department, avatar, role='student')
            if not ok:
                self.write_json({'error': msg}, 400)
                return

            self.write_json({'status': 'success', 'message': 'Account created successfully.'})
        except Exception as e:
            self.write_json({'error': str(e)}, 500)

class LoginApiHandler(BaseHandler):
    def post(self):
        try:
            body = json.loads(self.request.body.decode('utf-8'))
            email = body.get('email', '').strip()
            password = body.get('password', '')

            res, err = auth.authenticate_student(email, password)
            if err:
                self.write_json({'error': err}, 401)
                return

            self.set_cookie('chaiboard_session', res['token'], expires_days=7, httponly=False)
            self.write_json({'status': 'success', 'student': res['student'], 'token': res['token']})
        except Exception as e:
            self.write_json({'error': str(e)}, 500)

class LogoutApiHandler(BaseHandler):
    def post(self):
        token = self.get_cookie("chaiboard_session")
        if token:
            database.delete_session(token)
            self.clear_cookie("chaiboard_session")
        self.write_json({'status': 'logged_out'})

class MeApiHandler(BaseHandler):
    def get(self):
        user = self.current_user
        if not user:
            self.write_json({'error': 'Unauthorized'}, 401)
            return
        self.write_json({'student': user})

class MetricsApiHandler(BaseHandler):
    def get(self):
        user = self.current_user
        if not user:
            self.write_json({'error': 'Unauthorized'}, 401)
            return

        metrics = database.get_student_metrics(user['id'])
        history = database.get_student_chai_history(user['id'], limit=15)
        health = health_engine.evaluate_health_status(
            metrics['calories_today'],
            metrics['sugar_today'],
            metrics['caffeine_today'],
            metrics['avg_temp']
        )

        self.write_json({
            'student': user,
            'metrics': metrics,
            'health': health,
            'history': history
        })

class LogChaiApiHandler(BaseHandler):
    def post(self):
        user = self.current_user
        if not user:
            self.write_json({'error': 'Unauthorized'}, 401)
            return

        try:
            body = json.loads(self.request.body.decode('utf-8'))
            phash_binary = body.get('phash_binary', '')
            phash_hex = body.get('phash_hex', '')
            blend_val = body.get('blend', 'classic')
            sugar_val = body.get('sugar_level', 'standard')
            mobilenet_confidence = float(body.get('mobilenet_confidence', 95.0))
            is_tea_liquid = bool(body.get('is_tea_liquid', True))
            simulate_fraud = body.get('simulate_fraud_flag')

            # 1. Anti-Cheat and Fraud Verification
            verification = anti_cheat.verify_and_audit_upload(
                user['id'],
                phash_binary,
                phash_hex,
                mobilenet_confidence,
                is_tea_liquid,
                simulate_fraud
            )

            if not verification['passed']:
                self.write_json({
                    'status': 'rejected',
                    'error': verification['reason'],
                    'details': verification
                }, 400)
                return

            # 2. Nutrition and Blend Computation
            blend_names = {
                'classic': 'Standard Tapri Cutting',
                'masala': 'Kadak Masala Chai',
                'adrak': 'Adrak Strong Chai',
                'elaichi': 'Shahi Elaichi Special'
            }
            blend_name = blend_names.get(blend_val, 'Standard Tapri Cutting')

            calories = health_engine.BASELINE_CALORIES
            sugar = health_engine.BASELINE_SUGAR
            caffeine = health_engine.BASELINE_CAFFEINE

            if blend_val in ['masala', 'elaichi']:
                calories += 5.0
            elif blend_val == 'adrak':
                calories += 3.0

            if sugar_val == 'sugarfree':
                sugar = 0.0
                calories -= 30.0
            elif sugar_val == 'light':
                sugar = 3.5
                calories -= 15.0
            elif sugar_val == 'extra':
                sugar = 12.0
                calories += 18.0

            calories = max(15.0, calories)
            temp = round(random.uniform(58.0, 71.0), 1)

            # 3. Insert into SQL Database
            log_id = database.insert_chai_log(
                user['id'],
                blend_name,
                sugar,
                calories,
                caffeine,
                temp,
                phash_hex,
                phash_binary,
                mobilenet_confidence
            )

            self.write_json({
                'status': 'success',
                'message': 'Cutting chai verified & logged to SQL database.',
                'log': {
                    'id': log_id,
                    'blend_name': blend_name,
                    'sugar_grams': sugar,
                    'calories_kcal': calories,
                    'tongue_temp_c': temp,
                    'phash_hex': phash_hex
                }
            })
        except Exception as e:
            self.write_json({'error': str(e)}, 500)

class LeaderboardApiHandler(BaseHandler):
    def get(self):
        lb_type = self.get_argument('type', 'students')
        tier = self.get_argument('tier', 'daily')

        if lb_type == 'students':
            data = database.get_students_leaderboard(tier)
        else:
            data = database.get_departments_leaderboard()

        self.write_json({'leaderboard': data})

class AuditLogsApiHandler(BaseHandler):
    def get(self):
        logs = database.get_all_audit_logs(limit=40)
        self.write_json({'audit_logs': logs})

# --- Admin API Handlers ---

class AdminOverviewApiHandler(BaseHandler):
    def get(self):
        user = self.current_user
        if not user or user.get('role') != 'admin':
            self.write_json({'error': 'Forbidden: Admin access required'}, 403)
            return

        users = database.get_all_students_admin()
        stats = database.get_system_stats()
        settings = database.get_all_settings()

        self.write_json({
            'users': users,
            'stats': stats,
            'settings': settings
        })

class AdminUsersApiHandler(BaseHandler):
    def post(self):
        user = self.current_user
        if not user or user.get('role') != 'admin':
            self.write_json({'error': 'Forbidden'}, 403)
            return

        try:
            body = json.loads(self.request.body.decode('utf-8'))
            name = body.get('name', '').strip()
            email = body.get('email', '').strip()
            department = body.get('department', '').strip()
            role = body.get('role', 'student').strip()
            password = body.get('password', '')

            ok, msg = auth.register_student(name, email, password, department, '☕', role=role)
            if not ok:
                self.write_json({'error': msg}, 400)
                return

            self.write_json({'status': 'success', 'message': 'User created.'})
        except Exception as e:
            self.write_json({'error': str(e)}, 500)

    def put(self):
        user = self.current_user
        if not user or user.get('role') != 'admin':
            self.write_json({'error': 'Forbidden'}, 403)
            return

        try:
            body = json.loads(self.request.body.decode('utf-8'))
            user_id = int(body.get('id'))
            name = body.get('name', '').strip()
            email = body.get('email', '').strip()
            department = body.get('department', '').strip()
            role = body.get('role', 'student').strip()

            ok, msg = database.update_student_admin(user_id, name, email, department, role)
            if not ok:
                self.write_json({'error': msg}, 400)
                return

            self.write_json({'status': 'success', 'message': 'User updated.'})
        except Exception as e:
            self.write_json({'error': str(e)}, 500)

    def delete(self):
        user = self.current_user
        if not user or user.get('role') != 'admin':
            self.write_json({'error': 'Forbidden'}, 403)
            return

        try:
            user_id = int(self.get_argument('id'))
            if user_id == user['id']:
                self.write_json({'error': 'Cannot delete your own admin account.'}, 400)
                return

            database.delete_student_admin(user_id)
            self.write_json({'status': 'success', 'message': 'User deleted.'})
        except Exception as e:
            self.write_json({'error': str(e)}, 500)

class AdminResetPasswordApiHandler(BaseHandler):
    def post(self):
        user = self.current_user
        if not user or user.get('role') != 'admin':
            self.write_json({'error': 'Forbidden'}, 403)
            return

        try:
            body = json.loads(self.request.body.decode('utf-8'))
            user_id = int(body.get('id'))
            new_password = body.get('password', '')

            if len(new_password) < 4:
                self.write_json({'error': 'Password must be at least 4 characters'}, 400)
                return

            pwd_hash, salt = auth.hash_password(new_password)
            database.reset_student_password_admin(user_id, pwd_hash, salt)
            self.write_json({'status': 'success', 'message': 'Password reset successfully.'})
        except Exception as e:
            self.write_json({'error': str(e)}, 500)

class AdminSettingsApiHandler(BaseHandler):
    def post(self):
        user = self.current_user
        if not user or user.get('role') != 'admin':
            self.write_json({'error': 'Forbidden'}, 403)
            return

        try:
            body = json.loads(self.request.body.decode('utf-8'))
            for key, val in body.items():
                database.update_setting(key, str(val))
            self.write_json({'status': 'success', 'message': 'Settings updated.'})
        except Exception as e:
            self.write_json({'error': str(e)}, 500)

def seed_sample_students_if_empty():
    """Initializes realistic student & admin data in SQLite if the database is fresh."""
    # 1. Ensure Default Admin Account always exists
    admin = database.get_student_by_email("admin@chaiboard.com")
    if not admin:
        auth.register_student("Administrator", "admin@chaiboard.com", "adminpassword123", "Central Administration", "👑", role='admin')
        print("[Chaiboard SQL] Default Admin Account (admin@chaiboard.com) created.")

    conn = database.get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as cnt FROM students WHERE role != 'admin';")
    count = c.fetchone()['cnt']
    conn.close()

    if count == 0:
        print("[Chaiboard SQL] Initializing fresh database with seeded students...")
        samples = [
            ("Aarav Sharma", "aarav@example.com", "password123", "Computer Science", "☕"),
            ("Priya Patel", "priya@example.com", "password123", "Mechanical Engineering", "⚡"),
            ("Rohan Verma", "rohan@example.com", "password123", "Electronics & Comm", "📻"),
            ("Ananya Deshmukh", "ananya@example.com", "password123", "Biotechnology", "🧬"),
            ("Vikram Singh", "vikram@example.com", "password123", "Civil Engineering", "🏗️"),
        ]

        for name, email, pwd, dept, av in samples:
            ok, s_id = auth.register_student(name, email, pwd, dept, av)
            if ok:
                for i in range(random.randint(2, 5)):
                    b_hex = f"0x{random.randint(0x1000000000000000, 0xFFFFFFFFFFFFFFFF):X}"
                    b_bin = bin(int(b_hex, 16))[2:].zfill(64)
                    database.insert_chai_log(
                        s_id,
                        random.choice(["Standard Tapri Cutting", "Kadak Masala Chai", "Adrak Strong Chai"]),
                        random.choice([7.5, 3.5, 12.0]),
                        random.choice([45.0, 50.0, 30.0]),
                        30.0,
                        round(random.uniform(59.0, 68.0), 1),
                        b_hex,
                        b_bin,
                        round(random.uniform(92.0, 98.5), 1)
                    )
        print("[Chaiboard SQL] Seeded campus data successfully.")

def make_app():
    return tornado.web.Application([
        # Pages
        (r"/", RootHandler),
        (r"/login", LoginViewHandler),
        (r"/register", RegisterViewHandler),
        (r"/chamber", ChamberWindowHandler),
        (r"/metrics", MetricsWindowHandler),
        (r"/leaderboard", LeaderboardWindowHandler),
        (r"/profile", ProfileWindowHandler),
        (r"/audit", AuditWindowHandler),
        (r"/admin", AdminWindowHandler),

        # REST APIs
        (r"/api/register", RegisterApiHandler),
        (r"/api/login", LoginApiHandler),
        (r"/api/logout", LogoutApiHandler),
        (r"/api/me", MeApiHandler),
        (r"/api/metrics", MetricsApiHandler),
        (r"/api/log-chai", LogChaiApiHandler),
        (r"/api/leaderboard", LeaderboardApiHandler),
        (r"/api/audit-logs", AuditLogsApiHandler),

        # Admin APIs
        (r"/api/admin/overview", AdminOverviewApiHandler),
        (r"/api/admin/users", AdminUsersApiHandler),
        (r"/api/admin/reset-password", AdminResetPasswordApiHandler),
        (r"/api/admin/settings", AdminSettingsApiHandler),

        # Static assets
        (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(BASE_DIR, "static")}),
    ], cookie_secret="chaiboard_super_secret_enterprise_campus_key_2026", debug=False)

if __name__ == "__main__":
    database.init_db()
    seed_sample_students_if_empty()
    app = make_app()
    app.listen(PORT)
    print(f"============================================================")
    print(f"🫖 CHAIBOARD PYTHON & SQL MULTI-WINDOW BACKEND SERVER ACTIVE")
    print(f"   Listening on: http://localhost:{PORT}")
    print(f"   Admin Portal: http://localhost:{PORT}/admin")
    print(f"   Database: SQLite3 relational database (chaiboard.db)")
    print(f"============================================================")
    tornado.ioloop.IOLoop.current().start()
