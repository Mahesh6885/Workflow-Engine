"""
Approval Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.pagination import StandardResultsPagination
from .models import Approval
from .serializers import ApprovalSerializer, ApproveSerializer, RejectSerializer
from .services import ApprovalService


class ApprovalViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Approval management.
    Users see approvals assigned to them or their role.
    """
    serializer_class = ApprovalSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Approval.objects
            .select_related('assigned_to', 'resolved_by', 'step_execution', 'workflow_execution')
            .filter(assigned_to=user)
            .order_by('-created_at')
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """POST /approvals/{id}/approve/"""
        serializer = ApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approval = ApprovalService.approve(
            pk, request.user,
            comments=serializer.validated_data.get('comments', ''),
        )
        return Response({
            'success': True,
            'message': 'Approval granted. Workflow will resume.',
            'data': ApprovalSerializer(approval).data,
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """POST /approvals/{id}/reject/"""
        serializer = RejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approval = ApprovalService.reject(
            pk, request.user,
            reason=serializer.validated_data['reason'],
        )
        return Response({
            'success': True,
            'message': 'Approval rejected. Workflow has been stopped.',
            'data': ApprovalSerializer(approval).data,
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """GET /approvals/pending/ — quick access to pending approvals."""
        qs = self.get_queryset().filter(status=Approval.Status.PENDING)
        serializer = self.get_serializer(qs, many=True)
        return Response({'success': True, 'count': qs.count(), 'data': serializer.data})
