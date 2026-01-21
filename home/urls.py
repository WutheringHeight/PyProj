from django.contrib import admin
from django.urls import path,include
from . import views

urlpatterns = [
    path('home/', views.index, name='home_index'),
    path('create-project/', views.create_project, name='create_project'),
    path('delete-project/<int:project_id>/', views.delete_project, name='delete_project'),
    path('settings/', views.settings_view, name='settings'),
    path('upgrade/', views.upgrade_plan, name='upgrade_plan'),
]