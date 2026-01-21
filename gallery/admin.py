from django.contrib import admin
from .models import MeshObject

@admin.register(MeshObject)
class MeshObjectAdmin(admin.ModelAdmin):
    list_display = ("name", "is_default", "owner", "created_at")
    search_fields = ("name", "prompt", "owner__username")
    list_filter = ("is_default", "created_at")
