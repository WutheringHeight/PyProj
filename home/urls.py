from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home,name='home'),
    path("detail/",views.detail, name="detail"),
    path('detail/<str:folder>/', views.detail, name='detail_with_folder'),
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'), 
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    path("delete/<str:folder_name>/", views.delete_output, name="delete_output"),
] 
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
