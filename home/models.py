from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE) # Liên kết với tài khoản
    name = models.CharField(max_length=200) # Tên dự án\
    scene_data = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True) # Ngày tạo
    thumbnail = models.ImageField(upload_to='projects/', blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
class UserProfile(models.Model):
    PLAN_CHOICES = [
        ('FREE', 'Free'),
        ('BASIC', 'Basic'),
        ('UNLIMITED', 'Unlimited'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='FREE')
    
    def get_limit(self):
        limits = {'FREE': 3, 'BASIC': 10, 'UNLIMITED': 9999}
        return limits.get(self.plan)
    def __str__(self):
        return f"{self.user.username} - {self.plan}"

    # Signal: Tự động tạo Profile khi User mới được tạo
    @receiver(post_save, sender=User)
    def create_user_profile(sender, instance, created, **kwargs):
        if created:
            UserProfile.objects.get_or_create(user=instance)

    # Signal: Lưu Profile khi User được lưu
    @receiver(post_save, sender=User)
    def save_user_profile(sender, instance, **kwargs):
        instance.userprofile.save()