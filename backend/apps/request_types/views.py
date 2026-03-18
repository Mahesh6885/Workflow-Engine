"""
Request Types API
=================
Public API for users to browse and submit request types.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.workflows.models import Workflow


class RequestTypeListView(APIView):
    """
    GET /api/request-types/
    
    Returns list of request types available for users.
    Only returns workflows where:
    - is_active = True
    - is_public = True
    - status = 'published'
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get only request types that are active, public, and published
        workflows = (
            Workflow.objects
            .filter(
                is_active=True,
                is_public=True,
                status='published'
            )
            .exclude(active_version__isnull=True)
            .select_related('active_version')
            .prefetch_related('active_version__steps')
            .order_by('name')
        )
        
        request_types = []
        for wf in workflows:
            step_count = wf.active_version.steps.count() if wf.active_version else 0
            
            # Determine category based on workflow name
            name_lower = wf.name.lower()
            if 'expense' in name_lower or 'reimbursement' in name_lower:
                category = 'expense'
                icon = 'receipt'
            elif 'leave' in name_lower or 'vacation' in name_lower or 'time off' in name_lower:
                category = 'leave'
                icon = 'calendar'
            elif 'onboard' in name_lower or 'joining' in name_lower:
                category = 'onboarding'
                icon = 'user-plus'
            else:
                category = 'general'
                icon = 'file-text'
            
            # Use request_name if set, otherwise use workflow name
            display_name = wf.request_name if wf.request_name else wf.name
            
            request_types.append({
                'id': str(wf.id),
                'name': display_name,
                'description': wf.description or f'Submit a {display_name} request',
                'category': category,
                'icon': icon,
                'color': wf.color or '#6366f1',
                'step_count': step_count,
                'workflow_id': str(wf.id),
                'form_schema': wf.form_schema or [],
            })
        
        return Response({
            'success': True,
            'data': request_types,
            'count': len(request_types),
        })
