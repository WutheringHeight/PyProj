from django.shortcuts import render
from .models import MeshObject

def gallery(request):
    objects = MeshObject.objects.filter(is_default=True) 
    return render(request, 'gallery.html', {'objects': objects})
