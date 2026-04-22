from datetime import timedelta, date

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone  # Import the utility


class Folder(models.Model):
    title = models.CharField(max_length=200)
    # Add null=True and blank=True
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='folders',
        null=True,
        blank=True
    )


class Tag(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Deck(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='decks', null=True, blank=True
    )
    folder = models.ForeignKey(
        Folder, related_name='decks', on_delete=models.SET_NULL, null=True, blank=True
    )
    icon = models.CharField(max_length=50, default='Book')

    # --- NEW: Time Commitment Engine Fields ---
    daily_budget_minutes = models.IntegerField(default=15)  # The Unified Metric
    target_deadline = models.DateField(null=True, blank=True)  # Optional exam date

    difficulty_multiplier = models.FloatField(default=1.0)

    is_public = models.BooleanField(default=False)
    tags = models.ManyToManyField(Tag, blank=True)
    original_creator = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    parent_deck = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)

    view_count = models.IntegerField(default=0)
    share_count = models.IntegerField(default=0)

    def calculate_cards_per_day(self):
        """
        Estimates how many cards the user can review per day based on their budget.
        Assume an average of 20 seconds (0.33 mins) per card review.
        """
        SECONDS_PER_CARD = 20
        cards_per_minute = 60 / SECONDS_PER_CARD
        return int(self.daily_budget_minutes * cards_per_minute)

    def calculate_budget_from_deadline(self):
        """
        If a user sets a deadline, calculate how many minutes per day they need
        to study to see every card at least once.
        """
        if not self.target_deadline:
            return self.daily_budget_minutes

        days_remaining = (self.target_deadline - date.today()).days
        if days_remaining <= 0:
            return 60  # Default fallback if deadline is today/past

        total_cards = self.cards.count()
        # Assume 20 secs per card. Total minutes needed for 1 pass:
        total_minutes_needed = (total_cards * 20) / 60

        # Add a 40% buffer for Spaced Repetition reviews (seeing cards multiple times)
        adjusted_minutes = total_minutes_needed * 1.4

        calculated_budget = int(adjusted_minutes / days_remaining)

        # Don't let it suggest less than 5 mins
        return max(calculated_budget, 5)


class DeckView(models.Model):
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevents the same user/IP from flooding views
        unique_together = ('deck', 'user', 'ip_address')


class Card(models.Model):
    deck = models.ForeignKey(Deck, related_name='cards', on_delete=models.CASCADE)
    question = models.TextField()
    answer = models.TextField()

    def __str__(self):
        return f"{self.question[:30]}..."


class CardPerformance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    card = models.ForeignKey('Card', on_delete=models.CASCADE)

    # SRS Core Data
    easiness_factor = models.FloatField(default=2.5)  # The "EF" from SM-2 algorithm
    interval = models.IntegerField(default=0)  # Days until next review
    repetitions = models.IntegerField(default=0)  # Number of successful streaks

    # Timing
    last_reviewed = models.DateTimeField(auto_now_add=True)
    next_review = models.DateTimeField(default=timezone.now)

    # Meta stats for QOL
    times_wrong = models.IntegerField(default=0)
    times_correct = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'card')  # One tracking object per card per user

    def update_performance(self, quality, multiplier=1.0):
        # 1. Update Easiness Factor (Standard SM-2)
        # This stays the same as it represents the inherent difficulty of the card
        self.easiness_factor = self.easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

        if self.easiness_factor < 1.3:
            self.easiness_factor = 1.3

        # 2. Update Interval
        if quality >= 3:  # Correct response (Hard, Good, Easy)
            if self.repetitions == 0:
                # Apply multiplier even to the first jump (Default: 1 day)
                self.interval = max(1, round(1 * multiplier))
            elif self.repetitions == 1:
                # Apply multiplier to the second jump (Default: 6 days)
                self.interval = max(1, round(6 * multiplier))
            else:
                # Standard SM-2 logic scaled by your Deck intensity
                new_interval = self.interval * self.easiness_factor * multiplier
                self.interval = max(1, round(new_interval))

            self.repetitions += 1
            self.times_correct += 1
        else:  # Incorrect response (Again)
            self.repetitions = 0
            # If they fail, they see it tomorrow (or sooner if multiplier < 1)
            self.interval = max(1, round(1 * multiplier))
            self.times_wrong += 1

        # 3. Set next review date
        self.next_review = timezone.now() + timedelta(days=self.interval)
        self.save()


class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    deck = models.ForeignKey('Deck', on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    cards_seen = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)

    def accuracy(self):
        if self.cards_seen == 0: return 0
        return (self.correct_answers / self.cards_seen) * 100


class UserStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    streak_days = models.IntegerField(default=0)
    last_study_date = models.DateField(null=True, blank=True)
    total_cards_mastered = models.IntegerField(default=0)

    def update_streak(self):
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)

        # 1. If they already studied today, do nothing (saves DB writes)
        if self.last_study_date == today:
            return

        # 2. If they studied yesterday, increment streak
        if self.last_study_date == yesterday:
            self.streak_days += 1
        else:
            # 3. If they missed a day, reset to 1 (starting a new streak today)
            self.streak_days = 1

        self.last_study_date = today
        self.save()

    def __str__(self):
        return f"{self.user.username}'s Stats - Streak: {self.streak_days}"


class ReviewLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    card = models.ForeignKey(Card, on_delete=models.CASCADE)
    quality = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    easiness_before = models.FloatField()
    interval_before = models.IntegerField()

    class Meta:
        ordering = ['-timestamp']


@receiver(post_save, sender=User)
def create_user_stats(sender, instance, created, **kwargs):
    if created:
        UserStats.objects.create(user=instance)
