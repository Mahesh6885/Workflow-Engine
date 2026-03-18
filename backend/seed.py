import os
import django
from datetime import timedelta
from django.utils import timezone
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.authentication.models import User
from apps.workflows.models import Workflow, WorkflowVersion, WorkflowStep
from apps.workflows.services import WorkflowService
from apps.executions.services import ExecutionService
from apps.executions.models import WorkflowExecution, StepExecution
from apps.approvals.models import Approval
from apps.notifications.models import Notification
from apps.core.audit import AuditLog

print("Starting to seed database with Professional Enterprise Demo data...")

# 1. Clear existing dynamic data (except users)
WorkflowExecution.objects.all().delete()
Workflow.objects.all().delete()
Notification.objects.all().delete()
AuditLog.objects.all().delete()

# 2. Ensure Roles
def get_or_create_user(email, first_name, last_name, role, password):
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'role': role,
            'is_staff': role == 'admin',
            'is_superuser': role == 'admin'
        }
    )
    user.set_password(password)
    user.role = role
    user.save()
    return user

admin = get_or_create_user('admin@example.com', 'System', 'Administrator', 'admin', 'Admin123!')
admin.department = 'IT Operations'
admin.save()

manager = get_or_create_user('manager@example.com', 'Sarah', 'Johnson', 'manager', 'Manager123!')
manager.department = 'Human Resources'
manager.save()

hr = get_or_create_user('hr@example.com', 'Michael', 'Chen', 'hr', 'HR123!')
hr.department = 'Human Resources'
hr.save()

ceo = get_or_create_user('ceo@example.com', 'David', 'Williams', 'ceo', 'CEO123!')
ceo.department = 'Executive'
ceo.save()

finance = get_or_create_user('finance@example.com', 'Emily', 'Davis', 'finance', 'Finance123!')
finance.department = 'Finance'
finance.save()

standard_user = get_or_create_user('user@example.com', 'John', 'Standard', 'user', 'User123!')
standard_user.department = 'Engineering'
standard_user.save()

# 3. Create Diverse Workflows
workflow_templates = [
    {
        'name': 'Expense Reimbursement Request',
        'request_name': 'Expense Request',
        'is_public': True,
        'category': 'Finance',
        'desc': 'Submit and track expense reimbursement requests.',
        'icon': 'Receipt',
        'color': '#10b981',
        'form_schema': [
            {'name': 'amount', 'type': 'number', 'label': 'Amount', 'required': True, 'placeholder': 'Enter amount'},
            {'name': 'description', 'type': 'textarea', 'label': 'Description', 'required': True, 'placeholder': 'Describe the expense'},
            {'name': 'category', 'type': 'select', 'label': 'Category', 'required': True, 'options': ['Travel', 'Meals', 'Equipment', 'Other']},
        ],
        'steps': [
            {'name': 'Submit Expense Details', 'type': 'task', 'role': '', 'fields': [
                {'name': 'amount', 'label': 'Amount', 'type': 'number', 'required': True},
                {'name': 'description', 'label': 'Description', 'type': 'textarea', 'required': True},
                {'name': 'category', 'label': 'Category', 'type': 'select', 'options': ['Travel', 'Meals', 'Equipment', 'Other'], 'required': True},
            ]},
            {'name': 'Manager Approval', 'type': 'approval', 'role': 'manager'},
            {'name': 'Finance Review', 'type': 'approval', 'role': 'finance'},
        ]
    },
    {
        'name': 'Leave Request',
        'request_name': 'Leave Request',
        'is_public': True,
        'category': 'Human Resources',
        'desc': 'Request time off or vacation days.',
        'icon': 'Calendar',
        'color': '#3b82f6',
        'form_schema': [
            {'name': 'start_date', 'type': 'date', 'label': 'Start Date', 'required': True},
            {'name': 'end_date', 'type': 'date', 'label': 'End Date', 'required': True},
            {'name': 'reason', 'type': 'textarea', 'label': 'Reason', 'required': False, 'placeholder': 'Reason for leave'},
        ],
        'steps': [
            {'name': 'Leave Details', 'type': 'task', 'role': '', 'fields': [
                {'name': 'start_date', 'label': 'Start Date', 'type': 'date', 'required': True},
                {'name': 'end_date', 'label': 'End Date', 'type': 'date', 'required': True},
                {'name': 'reason', 'label': 'Reason', 'type': 'textarea', 'required': False},
            ]},
            {'name': 'Manager Approval', 'type': 'approval', 'role': 'manager'},
        ]
    },
    {
        'name': 'Employee Onboarding Request',
        'request_name': 'Onboarding Request',
        'is_public': True,
        'category': 'Human Resources',
        'desc': 'End-to-end orchestration for new hire logistics.',
        'icon': 'Users',
        'color': '#6366f1',
        'form_schema': [
            {'name': 'employee_name', 'type': 'text', 'label': 'Employee Name', 'required': True, 'placeholder': 'Full name of new employee'},
            {'name': 'department', 'type': 'text', 'label': 'Department', 'required': True, 'placeholder': 'Department name'},
            {'name': 'start_date', 'type': 'date', 'label': 'Start Date', 'required': True},
        ],
        'steps': [
            {'name': 'Identity Verification', 'type': 'task', 'role': '', 'fields': [
                {'name': 'employee_name', 'label': 'Employee Name', 'type': 'text', 'required': True},
                {'name': 'department', 'label': 'Department', 'type': 'text', 'required': True},
                {'name': 'start_date', 'label': 'Start Date', 'type': 'date', 'required': True},
            ]},
            {'name': 'Manager HR Approval', 'type': 'approval', 'role': 'manager'},
            {'name': 'Grant System Permissions', 'type': 'task', 'role': ''},
        ]
    },
    {
        'name': 'Infrastructure Deployment',
        'request_name': 'Infrastructure Request',
        'is_public': False,
        'category': 'DevOps',
        'desc': 'Automated AWS production stack provisioning.',
        'icon': 'Cloud',
        'color': '#f59e0b',
        'form_schema': [],
        'steps': [
            {'name': 'Scan Security Rules', 'type': 'task', 'role': ''},
            {'name': 'Lead DevOps Approval', 'type': 'approval', 'role': 'manager'},
            {'name': 'Apply Terraform Plan', 'type': 'task', 'role': ''},
        ]
    },
]

created_versions = []

for data in workflow_templates:
    wf = WorkflowService.create_workflow({
        'name': data['name'],
        'category': data['category'],
        'description': data['desc'],
        'icon': data['icon'],
        'color': data['color'],
        'request_name': data.get('request_name', ''),
    }, admin)
    
    # Set is_public, is_active, and form_schema flags
    wf.is_public = data.get('is_public', False)
    wf.is_active = True
    wf.form_schema = data.get('form_schema', [])
    wf.save()
    
    for i, s_data in enumerate(data['steps']):
        WorkflowService.add_step(wf.id, {
            'name': s_data['name'],
            'step_type': s_data['type'],
            'assigned_role': s_data.get('role', ''),
            'config': {'plugin': 'echo'}
        }, admin)
    
    version = WorkflowService.publish_workflow(wf.id, admin)
    created_versions.append(version)
    print(f"Workflow Ready: {wf.name} (Public: {wf.is_public})")

# 4. Create Executions & History
print("Simulating Enterprise Execution History...")

statuses = ['completed', 'running', 'failed', 'waiting']
for version in created_versions:
    for i in range(4):
        status = random.choice(statuses)
        ex = ExecutionService.start(version, standard_user, {'request_id': random.randint(1000, 9999)})
        
        ex.started_at = timezone.now() - timedelta(hours=random.randint(1, 24))
        if status == 'completed':
            ex.status = 'completed'
            ex.completed_at = ex.started_at + timedelta(minutes=random.randint(5, 120))
        elif status == 'failed':
            ex.status = 'failed'
            ex.error_message = "Handled Exception: Database connection timeout."
        elif status == 'waiting':
            ex.status = 'waiting'
            # Create the StepExecution for the approval step manually to appease FK
            app_step = version.steps.filter(step_type='approval').first()
            if app_step:
                stepex = StepExecution.objects.create(
                    workflow_execution=ex,
                    step=app_step,
                    status='waiting',
                    started_at=timezone.now()
                )
                Approval.objects.create(
                    workflow_execution=ex,
                    step_execution=stepex,
                    assigned_to=admin,
                    status='pending',
                    step_name=app_step.name,
                    workflow_name=version.workflow.name,
                    context_snapshot={'priority': 'P1', 'origin': 'Internal Application'}
                )
        elif status == 'running':
            ex.status = 'running'
        
        ex.save()
        
        # Add a completed step execution for the first step
        first_step = version.steps.first()
        if first_step:
            StepExecution.objects.get_or_create(
                workflow_execution=ex,
                step=first_step,
                defaults={
                    'status': 'completed',
                    'started_at': ex.started_at,
                    'completed_at': ex.started_at + timedelta(seconds=45) if ex.started_at else None
                }
            )

# 5. Create Audit Logs for Global Stats
print("Registering Audit Events...")
audit_actions = [
    (AuditLog.ActionType.LOGIN, "Auth Module: User session established"),
    (AuditLog.ActionType.PUBLISH, "Engine: Workflow version incremented & deployed"),
    (AuditLog.ActionType.EXECUTE, "Runtime: Pipeline thread spawned"),
    (AuditLog.ActionType.APPROVE, "Governance: Identity confirmed & authorized"),
    (AuditLog.ActionType.FAIL, "Runtime: Process terminated with exit code 1"),
]

for _ in range(25):
    act, desc = random.choice(audit_actions)
    AuditLog.log(
        action=act,
        actor=random.choice([admin, standard_user]),
        description=desc,
        ip_address="10.0.0." + str(random.randint(10, 99))
    )

# 6. Create Notifications
print("Broadcasting System Notifications...")
notif_data = [
    ('Governance Alert', 'New authorization request requires your attention.', 'approval_request'),
    ('Security Heartbeat', 'Weekly vulnerability scan completed with 0 findings.', 'generic'),
    ('Pipeline Health', 'Cloud Deploy #441 has reached 100% completion.', 'workflow_completed'),
    ('Engine Warning', 'Resource depletion slowing down execution threads.', 'generic'),
]

for title, msg, ntype in notif_data:
    Notification.objects.create(
        recipient=admin, title=title, message=msg, notification_type=ntype
    )
    Notification.objects.create(
        recipient=standard_user, title=title, message=msg, notification_type=ntype
    )

print("\nGLOBAL ENTERPRISE SEED COMPLETE.")
print("Login: admin@example.com / Admin123!")
