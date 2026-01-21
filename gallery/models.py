from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User

class MeshObject(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    prompt = models.CharField(max_length=255, blank=True)
    thumbnail = models.ImageField(upload_to="thumbnail/", blank=True, null=True)
    folder = models.CharField(max_length=500,null=True,blank=True)
    created_at = models.DateTimeField(default=timezone.now)     
    is_default = models.BooleanField(default=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name
