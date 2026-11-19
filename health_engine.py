"""
Chaiboard Health Engine Calculation Standards (PRD Section 4)
Computes cumulative intake, humorous warnings, and tongue temperature alerts.
"""

BASELINE_CALORIES = 45.0  # kcal per 100ml cup
BASELINE_SUGAR = 7.5      # grams per 100ml cup
BASELINE_CAFFEINE = 30.0  # mg per 100ml cup
BASELINE_VOLUME = 100.0   # ml

# Industrial Warning Thresholds
THRESHOLDS = {
    'calories': {
        'limit': 250.0,
        'warning_title': 'CALORIE LIMIT EXCEEDED',
        'humorous_quote': '“Running a marathon in your mind only” 🏃‍♂️💭',
        'industrial_title': 'Calorie Intake Threshold Exceeded',
        'clinical_note': 'Cumulative daily energy intake exceeds standard threshold of 250 kcal.'
    },
    'sugar': {
        'limit': 30.0,
        'warning_title': 'GLYCEMIC LOAD CEASEFIRE ALERT',
        'humorous_quote': '“Pancreas requests a temporary ceasefire” 🏳️🍬',
        'industrial_title': 'Glycemic Intake Threshold Exceeded',
        'clinical_note': 'Cumulative sugar intake exceeds standard daily ceiling of 30.0g.'
    },
    'caffeine': {
        'limit': 150.0,
        'warning_title': 'CAFFEINE SATURATION ALERT',
        'humorous_quote': '“Heart rate keeping tempo with a bass drum” 🥁⚡',
        'industrial_title': 'Caffeine Saturation Threshold Exceeded',
        'clinical_note': 'Cumulative caffeine intake exceeds recommended ceiling of 150.0mg.'
    }
}

def evaluate_health_status(calories: float, sugar: float, caffeine: float, latest_temp: float = 65.0):
    warnings = []

    if calories > THRESHOLDS['calories']['limit']:
        warnings.append({
            'metric': 'calories',
            'title': THRESHOLDS['calories']['warning_title'],
            'quote': THRESHOLDS['calories']['humorous_quote'],
            'industrial_title': THRESHOLDS['calories']['industrial_title'],
            'clinical_note': THRESHOLDS['calories']['clinical_note'],
            'value': calories,
            'limit': THRESHOLDS['calories']['limit']
        })

    if sugar > THRESHOLDS['sugar']['limit']:
        warnings.append({
            'metric': 'sugar',
            'title': THRESHOLDS['sugar']['warning_title'],
            'quote': THRESHOLDS['sugar']['humorous_quote'],
            'industrial_title': THRESHOLDS['sugar']['industrial_title'],
            'clinical_note': THRESHOLDS['sugar']['clinical_note'],
            'value': sugar,
            'limit': THRESHOLDS['sugar']['limit']
        })

    if caffeine > THRESHOLDS['caffeine']['limit']:
        warnings.append({
            'metric': 'caffeine',
            'title': THRESHOLDS['caffeine']['warning_title'],
            'quote': THRESHOLDS['caffeine']['humorous_quote'],
            'industrial_title': THRESHOLDS['caffeine']['industrial_title'],
            'clinical_note': THRESHOLDS['caffeine']['clinical_note'],
            'value': caffeine,
            'limit': THRESHOLDS['caffeine']['limit']
        })

    # Dispense Temperature Analysis
    if latest_temp > 67:
        temp_status = {
            'level': 'danger',
            'badge': f'{latest_temp:.1f}°C • High Temperature Warning',
            'description': 'Thermal threshold exceeded (>67°C). Allow fluid to equilibrate before consumption.'
        }
    elif latest_temp >= 55:
        temp_status = {
            'level': 'optimal',
            'badge': f'{latest_temp:.1f}°C • Standard Operating Temperature',
            'description': 'Optimal serving temperature range (55°C - 67°C).'
        }
    else:
        temp_status = {
            'level': 'cool',
            'badge': f'{latest_temp:.1f}°C • Sub-Optimal Temperature',
            'description': 'Fluid temperature is below standard serving baseline (<55°C).'
        }

    return {
        'warnings': warnings,
        'temperature': temp_status,
        'percent_calories': min(100, (calories / THRESHOLDS['calories']['limit']) * 100),
        'percent_sugar': min(100, (sugar / THRESHOLDS['sugar']['limit']) * 100),
        'percent_caffeine': min(100, (caffeine / THRESHOLDS['caffeine']['limit']) * 100),
    }

