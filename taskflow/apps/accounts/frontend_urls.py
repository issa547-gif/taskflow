from django.urls import path
from django.views.generic import TemplateView
from django.views import View
from django.shortcuts import redirect


class HomeRedirectView(View):
    def get(self, request):
        return redirect('/tasks/')


urlpatterns = [
    path('', HomeRedirectView.as_view(), name='home'),
    path('login/', TemplateView.as_view(template_name='accounts/login.html'), name='login'),
    path('register/', TemplateView.as_view(template_name='accounts/register.html'), name='register'),
]
