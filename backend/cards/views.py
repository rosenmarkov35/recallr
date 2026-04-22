from datetime import timedelta

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated

from .models import Folder, CardPerformance, Card, ReviewLog, UserStats, DeckView
from .serializers import DeckSerializer, FolderSerializer, CardSerializer


class DeckViewSet(viewsets.ModelViewSet):
    serializer_class = DeckSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def filtered_session(self, request, pk=None):
        deck = self.get_object()
        mode = request.query_params.get('mode', 'hard_first')

        # Base Queryset
        cards = Card.objects.filter(deck=deck)

        if mode == 'hard_first':
            # Chain them: Hardest Easiness first, then Medium
            # We exclude "Very Easy" cards (e.g., EF > 2.8) to "filter" them out
            selected_cards = cards.filter(cardperformance__user=request.user,
                                          cardperformance__easiness_factor__lt=2.8) \
                .order_by('cardperformance__easiness_factor')
        else:
            selected_cards = cards.all()

        serializer = CardSerializer(selected_cards, many=True, context={'request': request})
        return Response(serializer.data)

    from rest_framework.decorators import action

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        deck = self.get_object()
        user = request.user

        # 1. Review Logs for Heatmap and Retention
        logs = ReviewLog.objects.filter(card__deck=deck, user=user)

        # Heatmap Data
        heatmap_data = logs.annotate(date=TruncDate('timestamp')) \
            .values('date') \
            .annotate(count=Count('id')) \
            .order_by('date')

        # Performance Metrics
        total_reviews = logs.count()
        success_reviews = logs.filter(quality__gte=3).count()
        retention_rate = (success_reviews / total_reviews * 100) if total_reviews > 0 else 0

        # 2. Card Performance Data (The "Composition" Logic)
        # Get all records for this user/deck once
        perf_records = CardPerformance.objects.filter(card__deck=deck, user=user)

        # Identify Leeches first (Highest priority for categorization)
        leech_ids = set(perf_records.filter(easiness_factor__lt=1.8).values_list('card_id', flat=True))

        # Identify Mature (Interval >= 21, but NOT a leech)
        mature_ids = set(perf_records.filter(interval__gte=21)
                         .exclude(card_id__in=leech_ids)
                         .values_list('card_id', flat=True))

        # Identify Learning (Has repetitions, but NOT a leech and NOT mature)
        learning_ids = set(perf_records.filter(repetitions__gt=0)
                           .exclude(card_id__in=leech_ids)
                           .exclude(card_id__in=mature_ids)
                           .values_list('card_id', flat=True))

        # 3. Final Calculation
        total_cards_in_deck = deck.cards.count()

        # "New" are cards that aren't in any of the above sets
        active_card_ids = leech_ids | mature_ids | learning_ids
        new_count = total_cards_in_deck - len(active_card_ids)

        composition = {
            "leech": len(leech_ids),
            "mature": len(mature_ids),
            "learning": len(learning_ids),
            "new": max(0, new_count),  # Safety floor at 0
        }

        # Average Easiness (across all reviewed cards)
        avg_easiness = perf_records.aggregate(Avg('easiness_factor'))['easiness_factor__avg'] or 2.5

        return Response({
            "heatmap": {str(item['date']): item['count'] for item in heatmap_data},
            "retention_rate": round(retention_rate, 1),
            "total_reviews": total_reviews,
            "composition": composition,
            "avg_easiness": round(avg_easiness, 2)
        })

    @action(detail=True, methods=['get'])
    def budgeted_session(self, request, pk=None):
        deck = self.get_object()
        budget_mins = deck.daily_budget_minutes
        cards_to_show = budget_mins * 3  # 3 cards per minute

        # 1. Get cards that are due
        all_cards = deck.cards.all()

        # 2. Sort by "Retention Probability" (simplification: sort by next_review date)
        # Cards most overdue come first
        overdue_cards = []
        for card in all_cards:
            perf, _ = CardPerformance.objects.get_or_create(user=request.user, card=card)
            overdue_cards.append((card, perf.next_review))

        # Sort by the oldest review date
        overdue_cards.sort(key=lambda x: x[1])

        # 3. Slice to fit the budget
        selected_cards = [c[0] for c in overdue_cards[:cards_to_show]]

        serializer = CardSerializer(selected_cards, many=True)
        return Response({
            "title": deck.title,
            "daily_budget_minutes": budget_mins,
            "cards": serializer.data
        })

    def get_queryset(self):
        # Only returns decks owned by the logged-in user
        return Deck.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically saves the deck with the current user as owner
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        # 1. Save the basic deck metadata (title, icon, etc.)
        instance = serializer.save()

        raw_data = self.request.data.get('raw_data')
        q_sep = self.request.data.get('qa_separator', ';')
        c_sep = self.request.data.get('card_separator', '\n')

        if raw_data is not None:
            # 2. Get existing cards and map them by content
            # Key format: "Question|Answer" -> Card Object
            existing_cards = {f"{c.question.strip()}|{c.answer.strip()}": c
                              for c in instance.cards.all()}

            # 3. Parse incoming text
            incoming_lines = [line.strip() for line in raw_data.strip().split(c_sep) if q_sep in line]

            new_content_keys = set()
            cards_to_create = []

            for line in incoming_lines:
                parts = line.split(q_sep, 1)  # Split only on first separator
                q, a = parts[0].strip(), parts[1].strip()
                content_key = f"{q}|{a}"
                new_content_keys.add(content_key)

                # 4. If this pair doesn't exist, prepare to create it
                if content_key not in existing_cards:
                    cards_to_create.append(Card(deck=instance, question=q, answer=a))

            # 5. Delete cards that were REMOVED from the text area
            # If an existing card's key is NOT in the new set, kill it
            ids_to_delete = [card.id for key, card in existing_cards.items()
                             if key not in new_content_keys]
            Card.objects.filter(id__in=ids_to_delete).delete()

            # 6. Bulk create the genuinely new cards
            if cards_to_create:
                Card.objects.bulk_create(cards_to_create)


class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Even if null is allowed in DB, only show folders owned by this user
        return Folder.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Force the user to be the current logged-in user
        serializer.save(user=self.request.user)


class CardViewSet(viewsets.ModelViewSet):
    queryset = Card.objects.all()
    serializer_class = CardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only show cards belonging to the logged-in user
        return Card.objects.filter(deck__user=self.request.user)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """
        Endpoint: POST /api/cards/{id}/review/
        Payload: { "quality": 0-5, "multiplier": 0.5-2.0 }
        """
        card = self.get_object()
        quality_raw = request.data.get('quality')

        # 1. Capture the multiplier
        # Fallback to Deck's difficulty_multiplier if not provided in payload
        multiplier_raw = request.data.get('multiplier', card.deck.difficulty_multiplier)

        if quality_raw is None:
            return Response({"error": "Quality rating is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quality = int(quality_raw)
            multiplier = float(multiplier_raw)

            if not (0 <= quality <= 5):
                raise ValueError
        except ValueError:
            return Response({"error": "Invalid quality or multiplier format"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Get/Update performance record
        perf, created = CardPerformance.objects.get_or_create(
            user=request.user,
            card=card
        )

        # 3. Capture "Before" state for the log
        easiness_before = perf.easiness_factor
        interval_before = perf.interval

        # 4. Update the performance (SM-2 Logic)
        perf.update_performance(quality, multiplier=multiplier)

        # 5. Create the Review Log (Audit Trail)
        ReviewLog.objects.create(
            user=request.user,
            card=card,
            quality=quality,
            easiness_before=easiness_before,
            interval_before=interval_before,
        )

        # 6. Global User Stats & Streak Update
        # Using get_or_create ensures this doesn't crash for existing users
        from .models import UserStats
        stats, stats_created = UserStats.objects.get_or_create(user=request.user)
        stats.update_streak()

        return Response({
            'status': 'success',
            'next_review': perf.next_review,
            'interval': perf.interval,
            'repetitions': perf.repetitions,
            'easiness_factor': perf.easiness_factor,
            'streak_days': stats.streak_days  # Use the local 'stats' variable here
        })

    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        card = self.get_object()
        perf, created = CardPerformance.objects.get_or_create(user=request.user, card=card)
        return Response({
            'easiness_factor': perf.easiness_factor,
            'interval': perf.interval,
            'repetitions': perf.repetitions,
            'next_review': perf.next_review,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activity_view(request):
    # 1. Get Heatmap Data (last 90 days)
    logs = ReviewLog.objects.filter(
        user=request.user,
        timestamp__date__gte=timezone.now().date() - timedelta(days=90)
    ).annotate(date=TruncDate('timestamp')) \
        .values('date') \
        .annotate(count=Count('id'))

    # 2. Get/Update Streak
    stats, _ = UserStats.objects.get_or_create(user=request.user)

    # Optional: Safety check to reset streak if yesterday was missed
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    if stats.last_study_date and stats.last_study_date < yesterday:
        stats.streak_days = 0
        stats.save()

    return Response({
        "heatmap": {str(item['date']): item['count'] for item in logs},
        "streak": stats.streak_days
    })


@api_view(['GET'])
@permission_classes([AllowAny])  # Public profiles can be seen by anyone
def user_public_profile(request, username):
    # 1. Find the user by username
    target_user = get_object_or_404(User, username=username)

    # 2. Filter their decks: must be the owner AND deck must be public
    public_decks = Deck.objects.filter(user=target_user, is_public=True)

    # 3. Serialize and return
    serializer = PublicProfileDeckSerializer(public_decks, many=True)

    return Response({
        "username": target_user.username,
        "decks": serializer.data
    })


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Deck
from .serializers import PublicProfileDeckSerializer  # Or a dedicated PreviewSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def deck_preview(request, pk):
    try:
        deck = Deck.objects.get(pk=pk)

        # --- PRIVATE CHECK ---
        if not deck.is_public and deck.user != request.user:
            return Response({
                "is_private": True,
                "title": deck.title,
                "creator_name": deck.user.username if deck.user else "Anonymous"
            }, status=200)

        # --- CREATOR RESOLUTION ---
        creator = "Anonymous"
        if deck.original_creator:
            creator = deck.original_creator.username
        elif deck.user:
            creator = deck.user.username

        # --- BORROW LOGIC ---
        user = request.user
        root = deck.parent_deck or deck
        original_creator = deck.original_creator or deck.user

        can_borrow = True
        borrow_reason = None

        if not user.is_authenticated:
            can_borrow = False
            borrow_reason = "not_authenticated"

        elif deck.user == user or original_creator == user:
            can_borrow = False
            borrow_reason = "own_deck"

        elif Deck.objects.filter(user=user, parent_deck=root).exists():
            can_borrow = False
            borrow_reason = "already_borrowed"

        # --- DATA ---
        cards_sample = deck.cards.all()[:4].values('question', 'answer')

        data = {
            "id": deck.id,
            "title": deck.title,
            "icon": deck.icon,
            "creator_name": creator,
            "tags": [tag.name for tag in deck.tags.all()],
            "card_count": deck.cards.count(),
            "sample_cards": list(cards_sample),

            "is_private": False,

            # --- NEW FIELDS ---
            "can_borrow": can_borrow,
            "borrow_reason": borrow_reason,
        }

        return Response(data)

    except Deck.DoesNotExist:
        return Response({"error": "Deck not found"}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_decks(request):
    # 1. Base Queryset: Only public decks
    # Note: We select_related/prefetch to avoid N+1 query issues with tags and creators
    queryset = Deck.objects.filter(is_public=True, parent_deck__isnull=True).select_related(
        'original_creator').prefetch_related('tags')

    # 2. Handle Search Queries
    query = request.query_params.get('q', '').strip()

    if query:
        if query.startswith('@'):
            # Search by Username (remove the @)
            username_query = query[1:]
            queryset = queryset.filter(original_creator__username__icontains=username_query)

        elif query.startswith('#'):
            # Search by Tag (remove the #)
            tag_query = query[1:]
            queryset = queryset.filter(tags__name__icontains=tag_query).distinct()

        else:
            # General search: Title or Description (if you add one later)
            queryset = queryset.filter(Q(title__icontains=query))

    # 3. Sorting logic (Optional, based on your Popularity/Newest request)
    sort_by = request.query_params.get('sort', 'newest')
    if sort_by == 'popular':
        queryset = queryset.order_by('-view_count', '-share_count')
    else:
        # Assuming you have an auto_now_add field named 'created_at' or similar
        # If not, you can use '-id' as a proxy for newest
        queryset = queryset.order_by('-id')

    # 4. Serialize and Return
    serializer = PublicProfileDeckSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def record_view(request, deck_id):
    deck = Deck.objects.get(id=deck_id)

    def get_root(deck):
        while deck.parent_deck:
            deck = deck.parent_deck
        return deck

    root = get_root(deck)

    ip = request.META.get('REMOTE_ADDR')
    user = request.user if request.user.is_authenticated else None
    now = timezone.now()

    # Check existing view on ROOT (not borrowed deck)
    view = DeckView.objects.filter(
        deck=root,
        user=user,
        ip_address=ip
    ).first()

    if not view:
        # First ever view
        DeckView.objects.create(
            deck=root,
            user=user,
            ip_address=ip,
            timestamp=now
        )

        root.view_count += 1
        root.save()

        return Response({"status": "view_recorded"}, status=201)

    # Check 24h cooldown
    if view.timestamp < now - timedelta(hours=24):
        view.timestamp = now
        view.save()

        root.view_count += 1
        root.save()

        return Response({"status": "view_recorded"}, status=201)

    return Response({"status": "already_viewed"}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_deck(request, deck_id):
    user = request.user

    # Get the deck
    original = get_object_or_404(Deck, id=deck_id)

    # Resolve root deck (prevents deep chains)
    root = original.parent_deck or original

    # Resolve true original creator
    original_creator = original.original_creator or original.user

    # --- VALIDATIONS ---

    # 1. Prevent borrowing your own deck (both direct and inherited)
    if original.user == user or original_creator == user:
        return Response(
            {"error": "You cannot borrow your own deck."},
            status=400
        )

    # 2. Prevent duplicate borrowing (from same root)
    already_imported = Deck.objects.filter(
        user=user,
        parent_deck=root
    ).exists()

    if already_imported:
        return Response(
            {"error": "You have already borrowed this deck."},
            status=400
        )

    # --- ATOMIC OPERATION ---
    with transaction.atomic():

        # Lock relevant rows to prevent race conditions
        Deck.objects.select_for_update().filter(id=root.id)

        # Re-check inside transaction (important)
        if Deck.objects.filter(user=user, parent_deck=root).exists():
            return Response(
                {"error": "You have already borrowed this deck."},
                status=400
            )

        # --- CREATE NEW DECK ---
        new_deck = Deck.objects.create(
            title=original.title,
            description=original.description,
            user=user,
            folder=None,  # avoid copying folder ownership issues
            icon=original.icon,

            daily_budget_minutes=original.daily_budget_minutes,
            target_deadline=original.target_deadline,
            difficulty_multiplier=original.difficulty_multiplier,

            is_public=True,  # safer default

            original_creator=original_creator,
            parent_deck=root,
        )

        # --- COPY TAGS ---
        new_deck.tags.set(original.tags.all())

        # --- COPY CARDS ---
        cards = original.cards.all()
        new_cards = []

        for card in cards:
            card.pk = None  # detach from original
            card.deck = new_deck
            new_cards.append(card)

        # Bulk create for performance
        Card.objects.bulk_create(new_cards)

        # --- UPDATE SHARE COUNT ---
        root.share_count += 1
        root.save()

    return Response(
        {
            "status": "imported",
            "deck_id": new_deck.id
        },
        status=201
    )
