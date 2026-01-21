from django.conf import settings 
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('landingPage.urls')),
    path('', include('gallery.urls')),
    path('', include('render.urls')),
    path('', include('user_account.urls')),
    path('', include('home.urls')),
    path('', include('app_design.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
