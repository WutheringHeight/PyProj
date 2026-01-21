from django.contrib import admin
from django.urls import path,include
from . import views

urlpatterns = [
    path('app_design/', views.index, name='app_design_index'),
    path('app_design/<str:folder>/', views.index, name='app_design_with_folder'),
    path('save_project/<int:project_id>/', views.save_project, name='save_project'),   
]
