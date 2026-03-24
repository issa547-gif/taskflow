from django.urls import path
from .views import TaskListCreateView, TaskDetailView, task_stats, toggle_pin

urlpatterns = [
    path('', TaskListCreateView.as_view(), name='task-list-create'),
    path('<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('stats/', task_stats, name='task-stats'),
    path('<int:pk>/pin/', toggle_pin, name='task-pin'),
]
