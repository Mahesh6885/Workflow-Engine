"""
Core Permissions — Role-Based Access Control
"""
from rest_framework.permissions import BasePermission


class IsWorkflowAdmin(BasePermission):
    """Only users with role 'admin' or 'workflow_admin' can manage workflows."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['admin', 'workflow_admin']
        )


class IsApprover(BasePermission):
    """User must be designated as an approver."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'approver', 'manager']


class IsOwnerOrAdmin(BasePermission):
    """Object-level permission: owner or admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return getattr(obj, 'created_by', None) == request.user
