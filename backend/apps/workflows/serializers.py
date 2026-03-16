"""
Workflow Serializers
"""
from rest_framework import serializers
from .models import Workflow, WorkflowVersion, WorkflowStep, WorkflowCondition, WorkflowRule
from apps.authentication.serializers import UserSerializer


class WorkflowConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowCondition
        fields = [
            'id', 'group', 'field', 'operator', 'value', 'negate',
        ]


class WorkflowRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowRule
        fields = [
            'id', 'name', 'priority', 'condition',
            'action_type', 'target_step', 'action_config',
        ]


class WorkflowStepSerializer(serializers.ModelSerializer):
    conditions = WorkflowConditionSerializer(many=True, read_only=True)
    rules = WorkflowRuleSerializer(many=True, read_only=True)
    assigned_user_detail = UserSerializer(source='assigned_user', read_only=True)

    class Meta:
        model = WorkflowStep
        fields = [
            'id', 'name', 'description', 'step_type', 'order',
            'position_x', 'position_y',
            'assigned_role', 'assigned_user', 'assigned_user_detail',
            'config', 'max_retries', 'retry_delay_seconds',
            'timeout_seconds', 'is_optional',
            'conditions', 'rules',
        ]


class WorkflowStepWriteSerializer(serializers.ModelSerializer):
    """Write-only serializer — strips read-only nested fields."""
    class Meta:
        model = WorkflowStep
        fields = [
            'name', 'description', 'step_type', 'order',
            'position_x', 'position_y',
            'assigned_role', 'assigned_user',
            'config', 'max_retries', 'retry_delay_seconds',
            'timeout_seconds', 'is_optional',
        ]


class WorkflowVersionSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, read_only=True)
    published_by_detail = UserSerializer(source='published_by', read_only=True)

    class Meta:
        model = WorkflowVersion
        fields = [
            'id', 'version_number', 'changelog', 'is_active',
            'published_at', 'published_by', 'published_by_detail',
            'snapshot', 'steps', 'created_at',
        ]
        read_only_fields = ['id', 'version_number', 'published_at', 'is_active', 'snapshot']


class WorkflowListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    step_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    version_count = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            'id', 'name', 'description', 'category', 'status',
            'tags', 'icon', 'color',
            'step_count', 'version_count', 'created_by_name',
            'created_at', 'updated_at',
        ]

    def get_step_count(self, obj):
        if obj.active_version:
            return obj.active_version.steps.count()
        return 0

    def get_version_count(self, obj):
        return obj.versions.count()

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None


class WorkflowDetailSerializer(serializers.ModelSerializer):
    """Full workflow with active version and all steps."""
    active_version_detail = WorkflowVersionSerializer(source='active_version', read_only=True)
    versions = WorkflowVersionSerializer(many=True, read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = Workflow
        fields = [
            'id', 'name', 'description', 'category', 'status',
            'tags', 'icon', 'color',
            'active_version', 'active_version_detail', 'versions',
            'created_by', 'created_by_detail',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'active_version', 'created_at', 'updated_at']


class WorkflowCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workflow
        fields = ['name', 'description', 'category', 'tags', 'icon', 'color']
