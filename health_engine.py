"""
Chaiboard Health Engine Calculation Standards (PRD Section 4)
Computes cumulative intake, humorous warnings, and tongue temperature alerts.
"""

BASELINE_CALORIES = 45.0  # kcal per 100ml cup
BASELINE_SUGAR = 7.5      # grams per 100ml cup
BASELINE_CAFFEINE = 30.0  # mg per 100ml cup
BASELINE_VOLUME = 100.0   # ml

# Humorous Warning Thresholds from Concept Specification (Page 1)
THRESHOLDS = {
    'calories': {
        'limit': 250.0,
        'warning_title': '⚠️ CALORIE LIMIT EXCEEDED',
        'humorous_quote': '“Running a marathon in your mind only” 🏃‍♂️💭'
    },
    'sugar': {
        'limit': 30.0,
        'warning_title': '⚠️ PANCREAS CEASEFIRE ALERT',
        'humorous_quote': '“Pancreas requests a temporary ceasefire” 🏳️🍬'
    },
    'caffeine': {
        'limit': 150.0,
        'warning_title': '⚠️ BASS DRUM HEART ALERT',
        'humorous_quote': '“Heart rate keeping tempo with a bass drum” 🥁⚡'
    }
}

def evaluate_health_status(calories: float, sugar: float, caffeine: float, latest_temp: float = 65.0):
    warnings = []

    if calories > THRESHOLDS['calories']['limit']:
        warnings.append({
            'metric': 'calories',
            'title': THRESHOLDS['calories']['warning_title'],
            'quote': THRESHOLDS['calories']['humorous_quote'],
            'value': calories,
            'limit': THRESHOLDS['calories']['limit']
        })

    if sugar > THRESHOLDS['sugar']['limit']:
        warnings.append({
            'metric': 'sugar',
            'title': THRESHOLDS['sugar']['warning_title'],
            'quote': THRESHOLDS['sugar']['humorous_quote'],
            'value': sugar,
            'limit': THRESHOLDS['sugar']['limit']
        })

    if caffeine > THRESHOLDS['caffeine']['limit']:
        warnings.append({
            'metric': 'caffeine',
            'title': THRESHOLDS['caffeine']['warning_title'],
            'quote': THRESHOLDS['caffeine']['humorous_quote'],
            'value': caffeine,
            'limit': THRESHOLDS['caffeine']['limit']
        })

    # Tongue Temperature Analysis
    if latest_temp > 67:
        temp_status = {
            'level': 'danger',
            'badge': f'{latest_temp:.1f}°C • Scalding Hot',
            'description': 'Tongue burn alert! Let it cool or sip from saucer edge. ♨️'
        }
    elif latest_temp >= 55:
        temp_status = {
            'level': 'optimal',
            'badge': f'{latest_temp:.1f}°C • Peak Tapri Heat',
            'description': 'Optimal cutting temperature. Sips hit just right with full aroma. 🫖'
        }
    else:
        temp_status = {
            'level': 'cool',
            'badge': f'{latest_temp:.1f}°C • Lukewarm',
            'description': 'Bhai tapri wale se dubara garam karva le! ☕'
        }

    return {
        'warnings': warnings,
        'temperature': temp_status,
        'percent_calories': min(100, (calories / THRESHOLDS['calories']['limit']) * 100),
        'percent_sugar': min(100, (sugar / THRESHOLDS['sugar']['limit']) * 100),
        'percent_caffeine': min(100, (caffeine / THRESHOLDS['caffeine']['limit']) * 100),
    }

