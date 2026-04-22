# utils.py
from django.utils import timezone


def update_streak(profile):
    today = timezone.now().date()
    yesterday = today - timezone.timedelta(days=1)

    if profile.last_study_date == yesterday:
        profile.streak += 1
    elif profile.last_study_date != today:
        profile.streak = 1

    profile.last_study_date = today
    profile.save()