import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.authentication.models import User
from apps.workflows.models import Workflow, WorkflowVersion, WorkflowStep
from apps.workflows.services import WorkflowService
from apps.executions.services import ExecutionService
from apps.executions.models import WorkflowExecution
from apps.approvals.models import Approval
from apps.notifications.services import NotificationService

print("Starting to seed database with demo data...")

# 1. Ensure Admin User
admin, created = User.objects.get_or_create(
    email='admin@example.com',
    defaults={'first_name': 'Admin', 'last_name': 'System', 'role': 'admin', 'is_staff': True, 'is_superuser': True}
)
if created:
    admin.set_password('Admin123!')
    admin.save()
    print("Admin user created.")

manager, _ = User.objects.get_or_create(
    email='manager@example.com',
    defaults={'first_name': 'Mary', 'last_name': 'Manager', 'role': 'manager'}
)
manager.set_password('Admin123!')
manager.save()

# 2. Create Workflow
if not Workflow.objects.filter(name='Server Access Provision').exists():
    print("Creating 'Server Access Provision' Workflow...")
    wf = WorkflowService.create_workflow({
        'name': 'Server Access Provision', 
        'category': 'IT'
    }, admin)
    
    # 3. Add Steps
    step1 = WorkflowService.add_step(
        wf.id,
        {'name': 'Identify Request', 'step_type': 'task', 'config': {'plugin': 'echo'}},
        admin
    )
    
    step2 = WorkflowService.add_step(
        wf.id,
        {'name': 'Manager Approval', 'step_type': 'approval', 'assigned_user': manager, 'assigned_role': 'manager', 'config': {'approval_mode': 'any_one'}},
        admin
    )
    
    step3 = WorkflowService.add_step(
        wf.id,
        {'name': 'Execute Script', 'step_type': 'script', 'config': {'script_body': 'print("Access Granted!")'}},
        admin
    )
    
    # Provide layout logic
    wf_version = WorkflowVersion.objects.filter(workflow=wf, version_number=1).first()
    wf_version.steps.filter(id=step1.id).update(order=1, position_x=250, position_y=50)
    wf_version.steps.filter(id=step2.id).update(order=2, position_x=250, position_y=200)
    wf_version.steps.filter(id=step3.id).update(order=3, position_x=250, position_y=350)

    # Publish Workflow
    print("Publishing Draft...")
    version = WorkflowService.publish_workflow(wf.id, admin)
    
    # 4. Trigger Executions
    print("Triggering Executions...")
    
    # Ex 1: Running, stopped at Approval
    exec1 = ExecutionService.start(version, admin, {'server_type': 'AWS', 'instance': 't3.large'})
    
    # Ex 2: Completed execution mock (run Celery sync if we were using `task.apply()`)
    # Because we're using Celery async and eventlet isn't running in this script context, these will just pend.
    # We can fake it or just let Celery pick them up in the background!
    
print("Seed complete.")
