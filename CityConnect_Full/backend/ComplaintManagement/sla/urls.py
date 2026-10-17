
from django.urls import path

from .views import SLAListView


urlpatterns = [
    path("", SLAListView.as_view(), name="sla-list"),
]