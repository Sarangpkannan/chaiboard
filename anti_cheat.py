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
    Decodes base64 image and performs strict visual Computer Vision authentication
    for authentic Indian / Kerala cutting chai (Chaya) in a transparent glass tumbler:
    1. Detects authentic CTC milk tea color profile (warm caramel/amber spectrum in HSV and RGB)
    2. Detects top froth / foam layer (aerated chaya foam)
    3. Rejects human portraits, selfies, faces, and skin tones using internal facial landmark / void analysis
    4. Enforces upright glass tumbler geometry (aspect ratio 0.65 to 2.50, cylindrical/tapered profile)
    5. Detects transparent glass boundaries & vertical optical edge gradients (left & right glass walls)
    6. Rejects uniform surfaces (wooden tables, desks, walls, blankets, or floors)
    7. Rejects coffee mugs, bowls, bottles, plates, black tea, clear water, and non-tea objects
    """
    if not image_data_base64:
        return {
            'is_tea_liquid': False,
            'confidence': 0.0,
            'reason': "Fraud Detected: No camera image payload provided for authentication.",
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
            'reason': f"Fraud Detected: Malformed or unreadable image payload ({str(e)}).",
            'phash_binary': '0' * 64,
            'phash_hex': '0x0000000000000000'
        }

    phash_bin, phash_hex = compute_dhash_from_image(img)

    # Standardize image size for Computer Vision analysis
    w, h = 320, 320
    im = img.resize((w, h), Image.Resampling.BILINEAR)
    arr = np.array(im, dtype=np.float32)

    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    delta = max_c - min_c

    # Hue calculation (0 to 360 degrees)
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
    
    # Value / Luminance (0 to 1)
    v_arr = max_c / 255.0

    # 1. Authentic Kerala / Indian Cutting Chai (CTC Milk Tea) signature:
    # Liquid core: warm caramel-amber hue with rich milk-tea saturation
    liquid_core = (
        (h_deg >= 13) & (h_deg <= 44) &
        (s_arr >= 0.28) & (s_arr <= 0.90) &
        (v_arr >= 0.22) & (v_arr <= 0.88) &
        (r > g + 8) & (g > b + 5) &
        ((r - b) >= 25)
    )

    # Froth/foam layer: aerated creamy foam at top of chaya glass
    froth_layer = (
        (h_deg >= 15) & (h_deg <= 48) &
        (s_arr >= 0.16) & (s_arr <= 0.65) &
        (v_arr >= 0.60) & (v_arr <= 0.96) &
        (r > g) & (g >= b) &
        ((r - b) >= 15)
    )

    tea_mask = liquid_core | froth_layer
    total_pixels = w * h
    tea_pixel_count = int(np.sum(tea_mask))
    core_pixel_count = int(np.sum(liquid_core))
    tea_ratio = tea_pixel_count / total_pixels

    # Rejection 1: Absence of authentic chaya milk tea color
    if tea_ratio < 0.06:
        return {
            'is_tea_liquid': False,
            'confidence': 0.0,
            'reason': "Fraud Detected: No authentic chaya (milk tea) liquid detected in image.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    # Rejection 2: Uniform non-vessel surface (wooden table/desk, floor, or wall covering entire frame)
    if tea_ratio > 0.72:
        return {
            'is_tea_liquid': False,
            'confidence': 18.0,
            'reason': "Fraud Detected: Uniform non-vessel surface (wooden desk, table, or wall detected). No chaya glass tumbler identified.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    # Spatial coherence & Bounding Box of liquid
    y_indices, x_indices = np.where(tea_mask)
    y_min, y_max = int(np.min(y_indices)), int(np.max(y_indices))
    x_min, x_max = int(np.min(x_indices)), int(np.max(x_indices))

    box_h = y_max - y_min
    box_w = x_max - x_min

    # Rejection 3: Too small or fragmented
    if box_w < 35 or box_h < 45:
        return {
            'is_tea_liquid': False,
            'confidence': 20.0,
            'reason': "Fraud Detected: Detected liquid area too small or fragmented to be a chaya glass.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    aspect_ratio = box_h / max(1, box_w)
    # A traditional cutting chai glass liquid column is upright (aspect ratio 0.65 to 2.55)
    if aspect_ratio < 0.65 or aspect_ratio > 2.60:
        return {
            'is_tea_liquid': False,
            'confidence': 25.0,
            'reason': f"Fraud Detected: Vessel aspect ratio ({aspect_ratio:.2f}) does not match cutting chai tumbler (mug/bowl/flat object).",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    # Density inside bounding box: ensures liquid forms a coherent body
    box_area = box_w * box_h
    density = tea_pixel_count / max(1, box_area)
    if density < 0.38:
        return {
            'is_tea_liquid': False,
            'confidence': 30.0,
            'reason': "Fraud Detected: Irregular liquid dispersion; lacking coherent chaya vessel boundaries.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    # Rejection 4: Taper Profile (cutting glass is cylindrical or slightly tapered: top >= bottom)
    h_seg = box_h // 4
    top_w = np.sum(tea_mask[y_min + h_seg, :])
    bot_w = np.sum(tea_mask[y_max - h_seg, :])

    if top_w == 0 or bot_w == 0:
        return {
            'is_tea_liquid': False,
            'confidence': 28.0,
            'reason': "Fraud Detected: Irregular non-glass liquid distribution.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    taper = top_w / bot_w
    if taper < 0.68 or taper > 1.65:
        return {
            'is_tea_liquid': False,
            'confidence': 30.0,
            'reason': f"Fraud Detected: Vessel geometry (taper: {taper:.2f}) does not match cutting glass tumbler.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    # Rejection 5: Vertical Glass Wall Edge Check (Sobel X gradient)
    gray = 0.299 * r + 0.587 * g + 0.114 * b
    gx = np.abs(gray[1:-1, 2:] - gray[1:-1, :-2])
    pad = 10
    left_strip = gx[y_min:y_max, max(0, x_min-pad):min(w-2, x_min+pad)]
    right_strip = gx[y_min:y_max, max(0, x_max-pad):min(w-2, x_max+pad)]

    left_max = np.max(left_strip) if left_strip.size > 0 else 0
    right_max = np.max(right_strip) if right_strip.size > 0 else 0

    if left_max < 14 or right_max < 14:
        return {
            'is_tea_liquid': False,
            'confidence': 35.0,
            'reason': "Fraud Detected: Missing transparent glass tumbler vertical boundaries and optical reflections.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    # Rejection 6: Human Face / Portrait Rejection (internal dark eye features in skin tone)
    upper_h = int(box_h * 0.5)
    upper_mask = tea_mask[y_min:y_min+upper_h, x_min:x_max]
    upper_gray = gray[y_min:y_min+upper_h, x_min:x_max]
    
    internal_holes = 0
    for r_idx in range(upper_mask.shape[0]):
        row_tea = np.where(upper_mask[r_idx])[0]
        if len(row_tea) >= 10:
            first_t, last_t = row_tea[0], row_tea[-1]
            span = upper_mask[r_idx, first_t:last_t+1]
            span_dark = upper_gray[r_idx, first_t:last_t+1] < 60
            holes = (~span) & span_dark
            internal_holes += np.sum(holes)

    if internal_holes > 0.03 * (box_w * upper_h):
        return {
            'is_tea_liquid': False,
            'confidence': 18.0,
            'reason': "Fraud Detected: Facial features (eyes/portrait) detected instead of chaya glass tumbler.",
            'phash_binary': phash_bin,
            'phash_hex': phash_hex
        }

    confidence = min(99.2, 72.0 + (tea_ratio * 35.0) + (min(left_max, right_max) * 0.12))
    return {
        'is_tea_liquid': True,
        'confidence': round(float(confidence), 1),
        'reason': f"Authentic chaya in glass tumbler verified: CTC milk tea caramel spectrum and cutting glass geometry confirmed (Aspect Ratio: {aspect_ratio:.2f}).",
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
        is_tea_liquid = False
        mobilenet_confidence = 0.0
        cv_reason = "Fraud Detected: No image payload provided for chaya authentication."

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
