from datetime import datetime, timedelta, timezone

def calculate_sm2(rating: int, repetition: int, interval_days: int, ease_factor: float):
    """
    SuperMemo-2 (SM-2) Spaced Repetition Algorithm.
    Rating scale:
    1: Again / Forgot (failed recall)
    2: Hard (remembered with serious difficulty)
    3: Good (remembered with slight hesitation)
    4: Easy (perfect recall)
    """
    # Bound ease factor to sane limits
    ease_factor = max(1.3, float(ease_factor))
    
    if rating == 1:
        # Failed recall: reset repetitions and review tomorrow
        new_repetition = 0
        new_interval = 1
        new_ease_factor = max(1.3, ease_factor - 0.2)
    elif rating == 2:
        # Hard: slight increment, decrease ease
        new_repetition = repetition + 1
        new_interval = max(1, int(interval_days * 1.2)) if interval_days > 1 else 2
        new_ease_factor = max(1.3, ease_factor - 0.15)
    elif rating == 3:
        # Good: standard SM-2 progression
        if repetition == 0:
            new_interval = 1
        elif repetition == 1:
            new_interval = 6
        else:
            new_interval = max(1, int(interval_days * ease_factor))
        new_repetition = repetition + 1
        new_ease_factor = ease_factor
    elif rating == 4:
        # Easy: bonus interval and increase ease factor
        if repetition == 0:
            new_interval = 3
        elif repetition == 1:
            new_interval = 8
        else:
            new_interval = max(1, int(interval_days * ease_factor * 1.3))
        new_repetition = repetition + 1
        new_ease_factor = min(3.2, ease_factor + 0.15)
    else:
        new_repetition = repetition
        new_interval = interval_days
        new_ease_factor = ease_factor

    # Round interval to whole days
    new_interval = max(1, int(new_interval))
    now = datetime.now(timezone.utc)
    next_due_date = now + timedelta(days=new_interval)

    return new_repetition, new_interval, round(new_ease_factor, 2), next_due_date
