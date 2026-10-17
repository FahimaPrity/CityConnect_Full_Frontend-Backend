from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/accounts/", include("accounts.urls")),
    path("api/tickets/", include("tickets.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/sla/", include("sla.urls")),
    path("api/logs/", include("logs.urls")),
    path("api/dashboard/", include("dashboard.urls")),

    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]