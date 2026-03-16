"""
Core URL — exposes audit logs endpoint
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, DashboardStatsView

router = DefaultRouter()
router.register(r'logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
