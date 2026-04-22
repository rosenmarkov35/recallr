from django.contrib import admin

from .models import (
    Card, Deck, Folder, Tag,
    CardPerformance, StudySession,
    UserStats, ReviewLog
)


# 1. Specialized Admin for Cards
@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('question_excerpt', 'deck', 'id')
    list_filter = ('deck', 'deck__user')
    search_fields = ('question', 'answer')

    def question_excerpt(self, obj):
        return str(obj)

    question_excerpt.short_description = 'Question'


# 2. Specialized Admin for Decks (Includes Tag Management)
@admin.register(Deck)
class DeckAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'is_public', 'daily_budget_minutes', 'tag_list')
    list_filter = ('is_public', 'user', 'tags')
    search_fields = ('title', 'tags__name')
    filter_horizontal = ('tags',)  # Makes the Many-to-Many UI much better

    def tag_list(self, obj):
        return ", ".join([t.name for t in obj.tags.all()])

    tag_list.short_description = 'Tags'


# 3. User Stats & Progress Tracking
@admin.register(UserStats)
class UserStatsAdmin(admin.ModelAdmin):
    list_display = ('user', 'streak_days', 'last_study_date', 'total_cards_mastered')
    readonly_fields = ('streak_days', 'last_study_date')  # Prevent accidental streak editing


@admin.register(CardPerformance)
class CardPerformanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'card', 'interval', 'easiness_factor', 'next_review')
    list_filter = ('user', 'next_review')
    readonly_fields = ('last_reviewed',)


# 4. Simple Registrations for the rest
@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ('title', 'user')


@admin.register(ReviewLog)
class ReviewLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'card', 'quality', 'timestamp', 'interval_before')
    list_filter = ('quality', 'timestamp', 'user')


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'deck', 'cards_seen', 'correct_answers', 'start_time')
