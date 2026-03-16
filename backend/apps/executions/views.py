"""
Execution Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.pagination import StandardResultsPagination
from .models import WorkflowExecution, StepExecution
from .serializers import WorkflowExecutionSerializer, StepExecutionSerializer
from .services import ExecutionService


class WorkflowExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for reading execution state.
    Executions are started via POST /workflows/{id}/execute/
    """
    serializer_class = WorkflowExecutionSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            WorkflowExecution.objects
            .select_related('workflow_version__workflow', 'triggered_by', 'current_step')
            .prefetch_related('step_executions__step', 'step_executions__applied_rule')
            .filter(triggered_by=self.request.user)
            .order_by('-created_at')
        )

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """GET /executions/{id}/timeline/ — chronological step execution list."""
        execution = self.get_object()
        step_execs = execution.step_executions.select_related('step').order_by('created_at')
        return Response({
            'success': True,
            'execution_id': str(execution.id),
            'status': execution.status,
            'timeline': StepExecutionSerializer(step_execs, many=True).data,
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """POST /executions/{id}/cancel/"""
        execution = ExecutionService.cancel(pk, request.user)
        return Response({
            'success': True,
            'message': 'Execution cancelled.',
            'data': WorkflowExecutionSerializer(execution).data,
        })


class AllExecutionsViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin view of ALL executions."""
    serializer_class = WorkflowExecutionSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            WorkflowExecution.objects
            .select_related('workflow_version__workflow', 'triggered_by')
            .prefetch_related('step_executions')
            .all()
            .order_by('-created_at')
        )
