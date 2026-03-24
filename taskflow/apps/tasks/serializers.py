from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    is_overdue = serializers.ReadOnlyField()
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'priority', 'status',
            'due_date', 'is_pinned', 'is_overdue', 'owner_username',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'owner_username', 'is_overdue', 'created_at', 'updated_at')

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError('Title cannot be blank.')
        return value.strip()


class TaskCreateSerializer(TaskSerializer):
    class Meta(TaskSerializer.Meta):
        fields = ('id', 'title', 'description', 'priority', 'status', 'due_date', 'is_pinned')


class TaskStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    todo = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    done = serializers.IntegerField()
    overdue = serializers.IntegerField()
    high_priority = serializers.IntegerField()
