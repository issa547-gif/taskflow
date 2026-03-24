from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer, TaskStatsSerializer


class TaskListCreateView(generics.ListCreateAPIView):
    """List all tasks for current user, or create a new task."""
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority']
    ordering = ['-is_pinned', '-created_at']

    def get_queryset(self):
        qs = Task.objects.filter(owner=self.request.user)

        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        # Filter by priority
        priority_param = self.request.query_params.get('priority')
        if priority_param:
            qs = qs.filter(priority=priority_param)

        # Filter overdue tasks
        overdue = self.request.query_params.get('overdue')
        if overdue == 'true':
            qs = qs.filter(
                due_date__lt=timezone.now().date()
            ).exclude(status__in=['done', 'archived'])

        # Exclude archived by default
        include_archived = self.request.query_params.get('include_archived', 'false')
        if include_archived != 'true':
            qs = qs.exclude(status='archived')

        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a specific task (owner only)."""
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {'message': 'Task deleted successfully.'},
            status=status.HTTP_200_OK
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def task_stats(request):
    """Return task statistics for the current user."""
    qs = Task.objects.filter(owner=request.user)
    active_qs = qs.exclude(status='archived')
    today = timezone.now().date()

    stats = {
        'total': active_qs.count(),
        'todo': active_qs.filter(status='todo').count(),
        'in_progress': active_qs.filter(status='in_progress').count(),
        'done': active_qs.filter(status='done').count(),
        'overdue': active_qs.filter(
            due_date__lt=today
        ).exclude(status='done').count(),
        'high_priority': active_qs.filter(
            priority__in=['high', 'urgent']
        ).exclude(status='done').count(),
    }
    serializer = TaskStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_pin(request, pk):
    """Toggle the pinned state of a task."""
    try:
        task = Task.objects.get(pk=pk, owner=request.user)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

    task.is_pinned = not task.is_pinned
    task.save(update_fields=['is_pinned', 'updated_at'])
    return Response({
        'is_pinned': task.is_pinned,
        'message': 'Task pinned.' if task.is_pinned else 'Task unpinned.'
    })
