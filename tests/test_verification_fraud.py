import unittest
import io
import base64
from PIL import Image, ImageDraw
import anti_cheat
import database

class TestChaiFraudAuthentication(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        database.init_db()

    def create_simulated_chai_image(self):
        img = Image.new('RGB', (320, 320), color=(22, 25, 34))
        draw = ImageDraw.Draw(img)
        # Stainless coaster base
        draw.ellipse([(85, 230), (235, 260)], fill=(45, 55, 72))
        # 16-facet Cutting Glass with amber milk tea
        draw.polygon([(105, 70), (215, 70), (192, 245), (128, 245)], fill=(185, 93, 24))
        # Malai foam top
        draw.ellipse([(112, 72), (208, 92)], fill=(229, 169, 108))
        
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')

    def create_simulated_non_tea_image(self):
        img = Image.new('RGB', (320, 320), color=(40, 50, 70))
        draw = ImageDraw.Draw(img)
        draw.rectangle([(40, 40), (280, 280)], fill=(210, 215, 225))
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')

    def create_simulated_empty_glass_image(self):
        img = Image.new('RGB', (320, 320), color=(20, 20, 25))
        draw = ImageDraw.Draw(img)
        draw.polygon([(105, 70), (215, 70), (192, 245), (128, 245)], fill=(40, 45, 55), outline=(180, 190, 205))
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')

    def create_simulated_wood_surface_image(self):
        # Flat uniform brown surface without glass tumbler
        img = Image.new('RGB', (320, 320), color=(185, 93, 24))
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')

    def test_authentic_chai_image_passes(self):
        chai_b64 = self.create_simulated_chai_image()
        analysis = anti_cheat.analyze_chai_image_data(chai_b64)
        self.assertTrue(analysis['is_tea_liquid'])
        self.assertGreaterEqual(analysis['confidence'], 75.0)

        # Full verification workflow
        res = anti_cheat.verify_and_audit_upload(
            student_id=1,
            phash_binary='',
            phash_hex='',
            mobilenet_confidence=95.0,
            is_tea_liquid=True,
            image_data=chai_b64
        )
        self.assertTrue(res['passed'])
        self.assertIsNone(res['step_failed'])

    def test_non_tea_image_rejected_as_fraud(self):
        non_tea_b64 = self.create_simulated_non_tea_image()
        analysis = anti_cheat.analyze_chai_image_data(non_tea_b64)
        self.assertFalse(analysis['is_tea_liquid'])

        res = anti_cheat.verify_and_audit_upload(
            student_id=1,
            phash_binary='',
            phash_hex='',
            mobilenet_confidence=95.0,
            is_tea_liquid=True,
            image_data=non_tea_b64
        )
        self.assertFalse(res['passed'])
        self.assertEqual(res['step_failed'], 'OBJECT_CLASSIFICATION')
        self.assertIn('Fraud Detected', res['reason'])

    def test_empty_glass_rejected_as_fraud(self):
        empty_b64 = self.create_simulated_empty_glass_image()
        analysis = anti_cheat.analyze_chai_image_data(empty_b64)
        self.assertFalse(analysis['is_tea_liquid'])

        res = anti_cheat.verify_and_audit_upload(
            student_id=1,
            phash_binary='',
            phash_hex='',
            mobilenet_confidence=95.0,
            is_tea_liquid=True,
            image_data=empty_b64
        )
        self.assertFalse(res['passed'])
        self.assertEqual(res['step_failed'], 'OBJECT_CLASSIFICATION')
        self.assertIn('Fraud Detected', res['reason'])

    def test_uniform_wood_surface_rejected_as_fraud(self):
        wood_b64 = self.create_simulated_wood_surface_image()
        analysis = anti_cheat.analyze_chai_image_data(wood_b64)
        self.assertFalse(analysis['is_tea_liquid'])

        res = anti_cheat.verify_and_audit_upload(
            student_id=1,
            phash_binary='',
            phash_hex='',
            mobilenet_confidence=95.0,
            is_tea_liquid=True,
            image_data=wood_b64
        )
        self.assertFalse(res['passed'])
        self.assertEqual(res['step_failed'], 'OBJECT_CLASSIFICATION')
        self.assertIn('Fraud Detected', res['reason'])

    def test_duplicate_replay_rejected_as_fraud(self):
        res = anti_cheat.verify_and_audit_upload(
            student_id=1,
            phash_binary='1' * 64,
            phash_hex='0xFFFFFFFFFFFFFFFF',
            mobilenet_confidence=95.0,
            is_tea_liquid=True,
            simulate_fraud_flag='duplicate'
        )
        self.assertFalse(res['passed'])
        self.assertEqual(res['step_failed'], 'PERCEPTUAL_HASH_DUPLICATE')
        self.assertIn('Duplicate', res['reason'])

if __name__ == '__main__':
    unittest.main()

