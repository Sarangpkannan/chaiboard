"""
Chaiboard Backend Test Suite
Validates database transactions, PBKDF2 authentication, Admin RBAC,
Health Engine thresholds, and 64-bit pHash anti-cheat logic.
"""

import unittest
import database
import auth
import health_engine
import anti_cheat

class TestChaiboardBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        database.init_db()

    def test_01_password_hashing(self):
        pwd = "SecretCampusPassword@2026"
        pwd_hash, salt = auth.hash_password(pwd)
        self.assertTrue(auth.verify_password(pwd, pwd_hash, salt))
        self.assertFalse(auth.verify_password("WrongPassword", pwd_hash, salt))

    def test_02_health_engine_thresholds(self):
        status_normal = health_engine.evaluate_health_status(calories=120, sugar=15.0, caffeine=60.0, latest_temp=62.0)
        self.assertEqual(len(status_normal['warnings']), 0)
        self.assertEqual(status_normal['temperature']['level'], 'optimal')

        # Exceeding thresholds
        status_exceeded = health_engine.evaluate_health_status(calories=270, sugar=35.0, caffeine=180.0, latest_temp=72.0)
        self.assertEqual(len(status_exceeded['warnings']), 3)
        self.assertEqual(status_exceeded['temperature']['level'], 'danger')

        quotes = [w['quote'] for w in status_exceeded['warnings']]
        self.assertIn('“Running a marathon in your mind only” 🏃‍♂️💭', quotes)
        self.assertIn('“Pancreas requests a temporary ceasefire” 🏳️🍬', quotes)
        self.assertIn('“Heart rate keeping tempo with a bass drum” 🥁⚡', quotes)

    def test_03_anti_cheat_hamming_distance(self):
        hash_a = "1" * 64
        hash_b = "1" * 60 + "0000"  # 4 bits differ
        hash_c = "1" * 50 + "0" * 14 # 14 bits differ

        dist_ab = anti_cheat.compute_hamming_distance(hash_a, hash_b)
        dist_ac = anti_cheat.compute_hamming_distance(hash_a, hash_c)

        self.assertEqual(dist_ab, 4)
        self.assertEqual(dist_ac, 14)
        self.assertTrue(dist_ab < 5)

    def test_04_database_and_admin_management(self):
        test_email = "test.admin@example.com"
        pwd_hash, salt = auth.hash_password("Pass1234")
        student_id = database.create_student("Test Admin", test_email, pwd_hash, salt, "Computer Science", role='admin')
        
        # Verify retrieval
        student = database.get_student_by_email(test_email)
        self.assertIsNotNone(student)
        self.assertEqual(student['role'], "admin")

        # Test Admin update
        ok, msg = database.update_student_admin(student['id'], "Updated Admin", "updated.admin@example.com", "Electronics & Comm", "admin")
        self.assertTrue(ok)

        # Test Admin settings
        database.update_setting("threshold_calories", "280.0")
        settings = database.get_all_settings()
        self.assertEqual(settings.get("threshold_calories"), "280.0")

        # Test system stats
        stats = database.get_system_stats()
        self.assertGreaterEqual(stats['total_users'], 1)

if __name__ == '__main__':
    unittest.main()
