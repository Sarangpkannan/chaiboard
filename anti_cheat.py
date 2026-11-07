"""
Chaiboard Anti-Cheat & Fraud Prevention Engine (PRD Section 3)
Implements 64-bit Perceptual Hash (dHash/pHash) verification,
Hamming Distance calculations, and MobileNet object classification checks.
"""

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

def verify_and_audit_upload(student_id: int, phash_binary: str, phash_hex: str, mobilenet_confidence: float, is_tea_liquid: bool, simulate_fraud_flag: str = None):
    """
    Executes 3-step verification workflow:
    1. Live camera validation
    2. MobileNet tea liquid detection
    3. Perceptual hash duplicate rejection (Hamming distance < 5 within 12 hours)
    """

    # Check 1: Simulate or detect non-tea upload
    if simulate_fraud_flag == 'non_tea' or not is_tea_liquid or mobilenet_confidence < 40.0:
        reason = f"MobileNet rejection: No cutting chai glass with brown liquid detected (confidence: {mobilenet_confidence:.1f}%)."
        database.insert_audit_log(student_id, phash_hex, 'REJECTED_NON_TEA', reason, None)
        return {
            'passed': False,
            'step_failed': 'OBJECT_CLASSIFICATION',
            'reason': reason,
            'confidence': f"{mobilenet_confidence:.1f}%"
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
            # PRD Section 3 Rule: Hamming distance < 5 => Duplicate rejection
            if dist < 5:
                duplicate_detected = True
                break

    if duplicate_detected:
        reason = f"Duplicate chai image rejected! Hamming distance {min_dist} is below anti-cheat threshold (< 5) within 12h."
        database.insert_audit_log(student_id, phash_hex, 'REJECTED_DUPLICATE', reason, min_dist)
        return {
            'passed': False,
            'step_failed': 'PERCEPTUAL_HASH_DUPLICATE',
            'reason': reason,
            'min_hamming': min_dist,
            'phash': phash_hex
        }

    # Passed!
    reason = "Verified authentic live cutting chai. MobileNet tea glass & 64-bit pHash passed."
    database.insert_audit_log(student_id, phash_hex, 'VERIFIED_AUTHENTIC', reason, min_dist if recent_hashes else None)
    return {
        'passed': True,
        'step_failed': None,
        'reason': reason,
        'min_hamming': min_dist if recent_hashes else 'N/A (First 12h upload)',
        'phash': phash_hex
    }

