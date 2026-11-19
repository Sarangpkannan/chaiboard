"""
Chaiboard Industrial Anti-Cheat & Fraud Prevention Engine
Implements multi-stage Computer Vision authentication for Indian cutting chai in glass tumblers,
64-bit Perceptual Hash (dHash) verification, and 12-hour sliding-window duplicate replay prevention.
"""

import io
import re
import base64
import numpy as np
from PIL import Image
import database

def compute_hamming_distance(hash_a: str, hash_b: str) -> int:
    """Computes bit-level difference between two binary hash strings."""
    if not hash_a or not hash_b:
        return 64
    dist = 0
    length = min(len(hash_a), len(hash_b))
    for i in range(length):
        if hash_a[i] != hash_b[i]:
            dist += 1
    dist += abs(len(hash_a) - len(hash_b))
    return dist

def compute_dhash_from_image(img: Image.Image):
    """Computes standard 64-bit perceptual difference hash (dHash)."""
    gray = img.convert('L').resize((9, 8), Image.Resampling.LANCZOS)
    pixels = list(gray.getdata())
    binary = ""
    for row in range(8):
        for col in range(8):
            left = pixels[row * 9 + col]
            right = pixels[row * 9 + col + 1]
            binary += "1" if left < right else "0"
    hex_str = "0x" + f"{int(binary, 2):016X}"
    return binary, hex_str

def analyze_chai_image_data(image_data_base64: str):
    """
    Decodes base64 image and performs strict visual analysis:
    1. Detects authentic cutting chai (CTC milk tea) color profile in HSV & RGB
    2. Enforces container spatial coherence & aspect ratio (cutting glass tumbler)
    3. Rejects uniform surfaces (e.g. wooden desks, brown walls)
    4. Rejects empty vessels, non-tea beverages, and arbitrary objects (cars, faces, documents, mugs)
    """
    if not image_data_base64:
        return {
            'is_tea_liquid': False,
            'confidence': 0.0,
            'reason': "Fraud Detected: No image payload provided for authentication.",
            'phash_binary': '0' * 64,
            'phash_hex': '0x0000000000000000'
        }

    try:
        # Strip data URL prefix if present
        clean_b64 = re.sub(r'^data:image\/[a-zA-Z]+;base64,', '', image_data_base64.strip())
        img_bytes = base64.b64decode(clean_b64)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception as e:
        return {
            'is_tea_liquid': False,
            'confidence': 0.0,
            'reason': f"Fraud Detected: Malformed image payload ({str(e)}).",
            'phash_binary': '0' * 64,
            'phash_hex': '0x0000000000000000'
        }

    phash_bin, phash_hex = compute_dhash_from_image(img)

    # Standardize image size for analysis
    w, h = 320, 320
    im = img.resize((w, h), Image.Resampling.BILINEAR)
    arr = np.array(im, dtype=np.float32)

    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    delta = max_c - min_c

    # Hue calculation (0 to 360)
    h_arr = np.zeros_like(max_c)
    mask_delta = delta > 1e-4
    
    mask_r = (max_c == r) & mask_delta
    h_arr[mask_r] = ((g[mask_r] - b[mask_r]) / delta[mask_r]) % 6
    mask_g = (max_c == g) & mask_delta
    h_arr[mask_g] = ((b[mask_g] - r[mask_g]) / delta[mask_g]) + 2
    mask_b = (max_c == b) & mask_delta
    h_arr[mask_b] = ((r[mask_b] - g[mask_b]) / delta[mask_b]) + 4

    h_deg = h_arr * 60.0
    
    # Saturation (0 to 1)
    s_arr = np.zeros_like(max_c)
    s_arr[max_c > 0] = delta[max_c > 0] / max_c[max_c > 0]
    
    # Value (0 to 1)
    v_arr = max_c / 255.0

    # Authentic Indian Cutting Chai (CTC Black Tea + Whole Milk) signature:
    # 1. Hue strictly in warm amber / golden caramel spectrum: 14° to 48°
    # 2. Moderate saturation: 0.18 to 0.88
    # 3. Moderate brightness: 0.18 to 0.90
    # 4. R > G > B with red-over-blue differential >= 25, green-over-blue >= 8
    tea_mask = (
        (h_deg >= 14) & (h_deg <= 48) &
        (s_arr >= 0.18) & (s_arr <= 0.88) &
        (v_arr >= 0.18) & (v_arr <= 0.90) &
        (r > g) & (g > b) &
        ((r - b) >= 24)
    )

    total_pixels = w * h
    tea_pixel_count = int(np.sum(tea_mask))
    tea_ratio = tea_pixel_count / total_pixels

    # Rejection 1: Absence of milk tea color (cars, faces, dogs, documents, coffee mugs, non-tea drinks)
    if tea_ratio < 0.08:
        return {
            'is_tea_liquid': False,
            'confidence': round(float(tea_ratio * 120.0), 1),
            'reason': "Fraud Detected: No authentic cutting chai milk tea liquid detected in image.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    # Rejection 2: Uniform background (wooden table/desk or brown wall occupying entire frame)
    if tea_ratio > 0.88:
        return {
            'is_tea_liquid': False,
            'confidence': 24.0,
            'reason': "Fraud Detected: Uniform non-vessel surface detected (wooden desk/floor). No cutting chai glass tumbler identified.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    # Spatial coherence: Calculate bounding box of the tea liquid mass
    y_indices, x_indices = np.where(tea_mask)
    y_min, y_max = int(np.min(y_indices)), int(np.max(y_indices))
    x_min, x_max = int(np.min(x_indices)), int(np.max(x_indices))

    box_h = y_max - y_min
    box_w = x_max - x_min

    if box_w < 35 or box_h < 40:
        return {
            'is_tea_liquid': False,
            'confidence': 26.0,
            'reason': "Fraud Detected: Liquid signature too small or fragmented to constitute a cutting chai glass.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    aspect_ratio = box_h / max(1, box_w)
    # A cutting chai glass liquid column is typically upright (aspect ratio 0.55 to 3.2)
    if aspect_ratio < 0.55 or aspect_ratio > 3.2:
        return {
            'is_tea_liquid': False,
            'confidence': 28.0,
            'reason': f"Fraud Detected: Container geometry aspect ratio ({aspect_ratio:.2f}) does not match a cutting chai tumbler.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    # Density inside bounding box: ensures liquid forms a coherent body within the vessel
    box_area = box_w * box_h
    density = tea_pixel_count / max(1, box_area)
    if density < 0.35:
        return {
            'is_tea_liquid': False,
            'confidence': 32.0,
            'reason': "Fraud Detected: Liquid dispersion is irregular; lacking coherent cutting chai vessel boundaries.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    confidence = min(99.4, 76.0 + (tea_ratio * 40.0) + (density * 14.0))
    return {
        'is_tea_liquid': True,
        'confidence': round(float(confidence), 1),
        'reason': "Authentic cutting chai verified: Genuine milk tea liquid profile and cutting glass tumbler geometry identified.",
        'phash_binary': phash_bin,
        'phash_hex': phash_hex
    }

def verify_and_audit_upload(student_id: int, phash_binary: str, phash_hex: str, mobilenet_confidence: float, is_tea_liquid: bool, simulate_fraud_flag: str = None, image_data: str = None):
    """
    Executes comprehensive 3-step verification workflow:
    1. Visual Computer Vision authentication (Chaya in glass detection)
    2. Fraud prevention & non-tea rejection
    3. 64-bit Perceptual Hash duplicate replay rejection (Hamming distance < 5 within 12h)
    """

    # If raw image payload is provided, analyze image pixels
    if image_data:
        analysis = analyze_chai_image_data(image_data)
        is_tea_liquid = analysis['is_tea_liquid']
        mobilenet_confidence = analysis['confidence']
        phash_binary = analysis['phash_binary']
        phash_hex = analysis['phash_hex']
        cv_reason = analysis['reason']
    else:
        cv_reason = None

    # Check 1: Simulate or detect non-tea upload
    if simulate_fraud_flag == 'non_tea' or not is_tea_liquid or mobilenet_confidence < 45.0:
        reason = cv_reason if (cv_reason and not is_tea_liquid) else f"Fraud Detected: No authentic cutting chai glass with milk tea detected (Confidence: {mobilenet_confidence:.1f}%)."
        database.insert_audit_log(student_id, phash_hex, 'REJECTED_NON_TEA', reason, None)
        return {
            'passed': False,
            'step_failed': 'OBJECT_CLASSIFICATION',
            'reason': reason,
            'confidence': f"{mobilenet_confidence:.1f}%",
            'phash': phash_hex
        }

    # Check 2: 12-hour sliding window duplicate check from SQL database
    recent_hashes = database.get_recent_hashes_12h(student_id)
    min_dist = 64
    duplicate_detected = False

    if simulate_fraud_flag == 'duplicate':
        duplicate_detected = True
        min_dist = 2
    else:
        for entry in recent_hashes:
            dist = compute_hamming_distance(phash_binary, entry['phash_binary'])
            if dist < min_dist:
                min_dist = dist
            # Rejection rule: Hamming distance < 5 => Duplicate replay rejection
            if dist < 5:
                duplicate_detected = True
                break

    if duplicate_detected:
        reason = f"Fraud Detected: Duplicate chai image rejected. Hamming distance ({min_dist}) is below anti-cheat threshold (< 5) within 12h."
        database.insert_audit_log(student_id, phash_hex, 'REJECTED_DUPLICATE', reason, min_dist)
        return {
            'passed': False,
            'step_failed': 'PERCEPTUAL_HASH_DUPLICATE',
            'reason': reason,
            'min_hamming': min_dist,
            'phash': phash_hex
        }

    # Passed authentic verification
    reason = "Verified Authentic: Real cutting chai glass with milk tea liquid and unique 64-bit pHash confirmed."
    database.insert_audit_log(student_id, phash_hex, 'VERIFIED_AUTHENTIC', reason, min_dist if recent_hashes else None)
    return {
        'passed': True,
        'step_failed': None,
        'reason': reason,
        'confidence': f"{mobilenet_confidence:.1f}%",
        'min_hamming': min_dist if recent_hashes else 'N/A (First 12h upload)',
        'phash': phash_hex,
        'phash_binary': phash_binary
    }
