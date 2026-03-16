"""
Core Views — AuditLog read-only viewset
"""
from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .audit import AuditLog
from .serializers import AuditLogSerializer
from .pagination import StandardResultsPagination


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for audit logs.
    Only accessible to admins.
    """
    serializer_class = AuditLogSerializer
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action', 'actor']
    search_fields = ['description', 'metadata']
    ordering_fields = ['created_at', 'action']

    def get_queryset(self):
        return AuditLog.objects.select_related('actor', 'content_type').all()

    def get_permissions(self):
        return [permissions.IsAdminUser()]


from rest_framework.views import APIView
from rest_framework.response import Response
from apps.workflows.models import Workflow
from apps.executions.models import WorkflowExecution
from apps.approvals.models import Approval

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'success': True,
            'data': {
                'total_workflows': Workflow.objects.count(),
                'active_executions': WorkflowExecution.objects.filter(status='running').count(),
                'pending_approvals': Approval.objects.filter(status='pending').count(),
                'success_rate': 98.5, # Mocked for now
                'recent_activity': [] # TODO: fetch from AuditLog
            }
        })
