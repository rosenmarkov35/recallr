from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from cards.views import (
    DeckViewSet, FolderViewSet, CardViewSet,
    user_activity_view, user_public_profile, deck_preview,
    public_decks, record_view, import_deck  # Added record_view here
)
from users.views import RegisterView

router = DefaultRouter()
router.register(r'decks', DeckViewSet, basename='deck')
router.register(r'folders', FolderViewSet, basename='folder')
router.register(r'cards', CardViewSet)

urlpatterns = [
    # Custom Actions
    path('api/decks/public/', public_decks, name='public-decks'),
    path('api/decks/<int:deck_id>/view/', record_view, name='record-view'),
    path('api/decks/<int:deck_id>/import/', import_deck, name='import-deck'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),

    # Public Discovery Paths
    path('api/preview/<int:pk>/', deck_preview, name='deck-preview'),

    # Auth & Tokens
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='auth_register'),

    # User Info
    path('api/user/activity/', user_activity_view, name='user_activity'),
    path('api/profiles/<str:username>/', user_public_profile, name='user_public_profile'),
]
