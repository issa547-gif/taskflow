from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display  = ('title', 'owner', 'status', 'priority', 'due_date', 'is_pinned', 'created_at')
    list_filter   = ('status', 'priority', 'is_pinned')
    search_fields = ('title', 'description', 'owner__email')
    ordering      = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
