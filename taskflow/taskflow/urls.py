from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API routes
    path('api/auth/', include('apps.accounts.urls')),
    path('api/tasks/', include('apps.tasks.urls')),

    # Frontend routes
    path('', include('apps.accounts.frontend_urls')),
    path('tasks/', include('apps.tasks.frontend_urls')),
]
