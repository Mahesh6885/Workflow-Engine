"""
Workflow URLs — nested routing
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter
from .views import WorkflowViewSet, WorkflowStepViewSet

router = DefaultRouter()
router.register(r'', WorkflowViewSet, basename='workflow')

# Use standard approach for nested steps
urlpatterns = [
    path('', include(router.urls)),
]
