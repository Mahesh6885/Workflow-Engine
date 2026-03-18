"""
Request Types URLs
"""
from django.urls import path
from .views import RequestTypeListView

urlpatterns = [
    path('', RequestTypeListView.as_view(), name='request-types'),
]
