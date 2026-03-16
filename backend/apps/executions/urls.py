"""
Execution URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowExecutionViewSet, AllExecutionsViewSet

router = DefaultRouter()
router.register(r'my', WorkflowExecutionViewSet, basename='my-execution')
router.register(r'all', AllExecutionsViewSet, basename='all-execution')

urlpatterns = [
    path('', include(router.urls)),
]
