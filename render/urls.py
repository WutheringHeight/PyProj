from django.urls import path
from . import views

urlpatterns = [
    path("design/ai/", views.design_ai, name="design_ai"),
    path("design/manual/", views.design_manual, name="design_manual"),
    path('design/manual/<str:folder>/', views.design_manual, name='design_with_folder'),
    path("design/ai/", views.design_ai, name="design_ai"),
    path("design/ai/<str:folder>/", views.design_ai, name="design_ai_folder"),
    path("design/default/", views.design_default, name="design_default"),
    path("design/default/<str:folder>/", views.design_default, name="design_default_folder"),
    path("delete/<str:folder_name>/", views.delete_output, name="delete_output"),
    path("output/download/<str:folder>/", views.download_output, name="download_output"),
]
