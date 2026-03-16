"""
Workflow Views (DRF ViewSets)
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.core.permissions import IsWorkflowAdmin
from apps.core.pagination import StandardResultsPagination
from apps.core.exceptions import WorkflowNotPublishedError
from .models import Workflow, WorkflowVersion, WorkflowStep, WorkflowCondition, WorkflowRule
from .serializers import (
    WorkflowListSerializer,
    WorkflowDetailSerializer,
    WorkflowCreateSerializer,
    WorkflowVersionSerializer,
    WorkflowStepSerializer,
    WorkflowStepWriteSerializer,
    WorkflowConditionSerializer,
    WorkflowRuleSerializer,
)
from .services import WorkflowService

logger = logging.getLogger('apps.workflows')


class WorkflowViewSet(viewsets.ModelViewSet):
    """
    Full CRUD + custom actions for workflows.
    """
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'category']
    search_fields = ['name', 'description', 'tags']
    ordering_fields = ['created_at', 'name', 'status']

    def get_queryset(self):
        return (
            Workflow.objects
            .select_related('active_version', 'created_by')
            .prefetch_related('versions')
            .all()
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkflowListSerializer
        if self.action in ['create']:
            return WorkflowCreateSerializer
        return WorkflowDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'publish']:
            return [IsWorkflowAdmin()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = WorkflowCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        workflow = WorkflowService.create_workflow(serializer.validated_data, request.user)
        return Response(
            {'success': True, 'data': WorkflowDetailSerializer(workflow).data},
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete(user=request.user)
        return Response({'success': True, 'message': 'Workflow deleted.'}, status=204)

    @action(detail=True, methods=['post'], permission_classes=[IsWorkflowAdmin])
    def publish(self, request, pk=None):
        """POST /workflows/{id}/publish/ — Publish a draft workflow."""
        changelog = request.data.get('changelog', '')
        version = WorkflowService.publish_workflow(pk, request.user, changelog)
        return Response({
            'success': True,
            'message': f'Workflow published as version {version.version_number}.',
            'data': WorkflowVersionSerializer(version).data,
        })

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """POST /workflows/{id}/duplicate/ — Clone workflow."""
        new_workflow = WorkflowService.duplicate_workflow(pk, request.user)
        return Response({
            'success': True,
            'data': WorkflowDetailSerializer(new_workflow).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def simulate(self, request, pk=None):
        """POST /workflows/{id}/simulate/ — Dry-run workflow without persisting results."""
        from apps.executions.engine import WorkflowEngine
        workflow = self.get_object()
        if not workflow.active_version:
            raise WorkflowNotPublishedError()
        context = request.data.get('context', {})
        result = WorkflowEngine.simulate(workflow.active_version, context)
        return Response({'success': True, 'simulation': result})

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """POST /workflows/{id}/execute/ — Start a live execution."""
        from apps.executions.services import ExecutionService
        workflow = self.get_object()
        if not workflow.active_version:
            raise WorkflowNotPublishedError()
        context = request.data.get('context', {})
        execution = ExecutionService.start(
            workflow_version=workflow.active_version,
            triggered_by=request.user,
            context=context,
        )
        from apps.executions.serializers import WorkflowExecutionSerializer
        return Response({
            'success': True,
            'data': WorkflowExecutionSerializer(execution).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """GET /workflows/{id}/versions/ — List all versions."""
        workflow = self.get_object()
        versions = workflow.versions.all()
        serializer = WorkflowVersionSerializer(versions, many=True)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=True, methods=['get', 'post'], url_path='steps')
    def steps(self, request, pk=None):
        """GET/POST /workflows/{id}/steps/"""
        workflow = self.get_object()
        latest_version = workflow.versions.first()
        if request.method == 'GET':
            steps = latest_version.steps.all() if latest_version else []
            return Response({
                'success': True,
                'data': WorkflowStepSerializer(steps, many=True).data,
            })
        if request.method == 'POST':
            serializer = WorkflowStepWriteSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            step = WorkflowService.add_step(pk, serializer.validated_data, request.user)
            return Response({
                'success': True,
                'data': WorkflowStepSerializer(step).data,
            }, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=['post'])
    def update_canvas(self, request, pk=None):
        """POST /workflows/{id}/update_canvas/ — Sync UI nodes/edges to DB."""
        version = WorkflowService.update_canvas(pk, request.data, request.user)
        return Response({
            'success': True,
            'message': 'Canvas updated.',
            'data': WorkflowVersionSerializer(version).data
        })


class WorkflowStepViewSet(viewsets.ModelViewSet):
    """CRUD for individual steps."""
    permission_classes = [IsWorkflowAdmin]

    def get_queryset(self):
        return (
            WorkflowStep.objects
            .prefetch_related('conditions', 'rules')
            .filter(workflow_version__workflow_id=self.kwargs.get('workflow_pk'))
        )

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WorkflowStepWriteSerializer
        return WorkflowStepSerializer

    @action(detail=True, methods=['post'])
    def add_condition(self, request, pk=None, workflow_pk=None):
        """POST /workflows/{wid}/steps/{sid}/add_condition/"""
        step = self.get_object()
        serializer = WorkflowConditionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        condition = serializer.save(step=step)
        return Response({'success': True, 'data': WorkflowConditionSerializer(condition).data})

    @action(detail=True, methods=['post'])
    def add_rule(self, request, pk=None, workflow_pk=None):
        """POST /workflows/{wid}/steps/{sid}/add_rule/"""
        step = self.get_object()
        serializer = WorkflowRuleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rule = serializer.save(step=step)
        return Response({'success': True, 'data': WorkflowRuleSerializer(rule).data})
