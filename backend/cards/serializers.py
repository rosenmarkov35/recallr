from rest_framework import serializers

from .models import Deck, Card, Folder, CardPerformance, Tag


class CardSerializer(serializers.ModelSerializer):
    # This creates a virtual field in the JSON output
    performance = serializers.SerializerMethodField()

    class Meta:
        model = Card
        fields = ['id', 'question', 'answer', 'performance']

    def get_performance(self, obj):
        # Access the user from the context (passed by the ViewSet)
        user = self.context.get('request').user
        if user and user.is_authenticated:
            perf = CardPerformance.objects.filter(user=user, card=obj).first()
            if perf:
                return {
                    "next_review": perf.next_review,
                    "easiness_factor": perf.easiness_factor,
                    "interval": perf.interval,
                    "repetitions": perf.repetitions
                }
        return None  # Return null if no performance record exists yet


class DeckSerializer(serializers.ModelSerializer):
    original_creator_name = serializers.SerializerMethodField()
    estimated_daily_cards = serializers.SerializerMethodField()

    cards = CardSerializer(many=True, read_only=True)
    user = serializers.ReadOnlyField(source='user.username')

    # --- SAFE FIELDS ---
    parent_deck = serializers.PrimaryKeyRelatedField(read_only=True)
    original_creator = serializers.PrimaryKeyRelatedField(read_only=True)

    folder = serializers.PrimaryKeyRelatedField(
        queryset=Folder.objects.all(),
        allow_null=True,
        required=False
    )

    icon = serializers.CharField(default="Book")

    # --- INPUT ONLY ---
    raw_data = serializers.CharField(write_only=True, required=False)
    qa_separator = serializers.CharField(write_only=True, required=False, allow_blank=True)
    card_separator = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Deck
        fields = [
            'id',
            'title',
            'user',
            'cards',
            'icon',
            'folder',
            'is_public',

            'daily_budget_minutes',
            'target_deadline',
            'difficulty_multiplier',

            'estimated_daily_cards',

            'parent_deck',
            'original_creator',
            'original_creator_name',

            'raw_data',
            'qa_separator',
            'card_separator',
        ]
        read_only_fields = [
            'parent_deck',
            'original_creator',
            'user',
        ]

    # --- COMPUTED FIELDS ---

    def get_estimated_daily_cards(self, obj):
        return obj.calculate_cards_per_day()

    def get_original_creator_name(self, obj):
        if obj.original_creator:
            return obj.original_creator.username
        return None

    # --- CREATE LOGIC ---

    def create(self, validated_data):
        request = self.context.get('request')

        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        # Extract special fields
        raw_data = validated_data.pop('raw_data', '')
        tags_data = request.data.get('tags', [])

        q_sep = validated_data.pop('qa_separator', ';') or ';'
        c_sep = validated_data.pop('card_separator', '\n') or '\n'

        # Set ownership explicitly
        validated_data['user'] = request.user
        validated_data['original_creator'] = request.user

        # Create deck (parent_deck will always be NULL here)
        deck = Deck.objects.create(**validated_data)

        # --- TAGS ---
        for tag_name in tags_data:
            tag_name = tag_name.strip()
            if tag_name:
                tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
                deck.tags.add(tag_obj)

        # --- CARDS ---
        if raw_data:
            self._parse_and_create_cards(deck, raw_data, c_sep, q_sep)

        return deck

    # --- CARD PARSER ---

    def _parse_and_create_cards(self, deck, raw_text, c_sep, q_sep):
        if c_sep == '\n':
            raw_cards = raw_text.strip().splitlines()
        else:
            raw_cards = raw_text.strip().split(c_sep)

        cards_to_create = []

        for raw_card in raw_cards:
            if q_sep in raw_card:
                parts = raw_card.split(q_sep)
                question = parts[0].strip()
                answer = q_sep.join(parts[1:]).strip()

                if question and answer:
                    cards_to_create.append(
                        Card(deck=deck, question=question, answer=answer)
                    )

        if cards_to_create:
            Card.objects.bulk_create(cards_to_create)


# cards/serializers.py

class FolderSerializer(serializers.ModelSerializer):
    # 'decks' uses the related_name from your Deck model
    decks = DeckSerializer(many=True, read_only=True)
    user = serializers.ReadOnlyField(source='user.username')

    # If Folder model doesn't have an icon field yet,
    # you can define it here as a default like you did for Deck
    icon = serializers.CharField(default="Folder", read_only=True)

    class Meta:
        model = Folder
        # Added 'icon' and 'user' back into the fields list
        fields = ['id', 'title', 'decks', 'icon', 'user']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['name']


class PublicProfileDeckSerializer(serializers.ModelSerializer):
    # This turns the ID list into a list of names for React
    tags = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )
    creator_name = serializers.ReadOnlyField(source='original_creator.username')
    is_imported = serializers.SerializerMethodField()

    class Meta:
        model = Deck
        fields = ['id', 'title', 'description', 'icon', 'is_public', 'tags', 'creator_name', 'is_imported',
                  'view_count',
                  'share_count']

    def get_is_imported(self, obj):
        # Using .exists() or direct comparison is safer
        return obj.original_creator is not None and obj.user != obj.original_creator
