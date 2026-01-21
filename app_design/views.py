from django.shortcuts import render
from django.http import HttpResponse
import os
import shutil
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from gallery.models  import MeshObject
from home.models import Project
from home.models import UserProfile

# Create your views here.
@login_required
def index(request,folder=None):
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    project_id = request.GET.get('id')
    project = get_object_or_404(Project, id=project_id, user=request.user)
    
    # Lấy thông tin gói từ UserProfile
    profile = request.user.userprofile 
    limits = {
        'FREE': {'projects': 3, 'objects': 10},
        'BASIC': {'projects': 10, 'objects': 50},
        'UNLIMITED': {'projects': 999, 'objects': 999}
    }
    current_limit = limits.get(profile.plan, limits['FREE'])
    """
    - GET  : hiển thị scene + danh sách model
    - POST : upload OBJ / MTL / texture
    """
    
    base_output = os.path.join(settings.BASE_DIR, "clipmesh", "output")

    # =========================
    # UPLOAD MODEL
    # =========================
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        obj_file = request.FILES.get("obj_file")
        mtl_file = request.FILES.get("mtl_file")
        textures = request.FILES.getlist("textures")

        if not name or not obj_file or not mtl_file:
            return redirect("app_design_index")

        user_folder = os.path.join(
            base_output,
            name,
            "meshes",
            "mesh_0"
        )
        os.makedirs(user_folder, exist_ok=True)

        # OBJ
        with open(os.path.join(user_folder, "mesh.obj"), "wb+") as f:
            for chunk in obj_file.chunks():
                f.write(chunk)

        # MTL
        with open(os.path.join(user_folder, "mesh.mtl"), "wb+") as f:
            for chunk in mtl_file.chunks():
                f.write(chunk)

        # TEXTURES
        for tex in textures:
            with open(os.path.join(user_folder, tex.name), "wb+") as f:
                for chunk in tex.chunks():
                    f.write(chunk)

        # DB
        MeshObject.objects.create(
            name=name,
            owner=request.user,
            folder=name
        )

        return redirect("app_design_index")

    # =========================
    # LOAD 1 MODEL (CLICK LIST)
    # =========================
    mesh = mtl = output = None
    if folder:
        mesh = f"/media/{folder}/meshes/mesh_0/mesh.obj"
        mtl  = f"/media/{folder}/meshes/mesh_0/mesh.mtl"
        output = folder

    # =========================
    # LOAD ALL OUTPUTS
    # =========================
    all_outputs = MeshObject.objects.filter(
        owner=request.user
    ).order_by("-created_at")
    context = {
        'project': project,
        'user_limit_projects': current_limit['projects'],
        'user_limit_objects': current_limit['objects'],
        "mesh": mesh,
        "mtl": mtl,
        "output": output,
        "all_outputs": all_outputs,
        "scene_data_json": project.scene_data or "[]", 
    }
    return render(request, "design.html", context)  
    
@csrf_exempt
@login_required
def save_project(request, project_id):
    if request.method == 'POST':
        project = get_object_or_404(Project, id=project_id, user=request.user)
        data = json.loads(request.body)
        
        # Lưu dữ liệu scene
        project.scene_data = data.get('scene_data')
        project.save()
        
        return JsonResponse({'status': 'success', 'message': 'Đã lưu dự án!'})
    return JsonResponse({'status': 'error'}, status=400)

def get_latest_output():
    output_root = "clipmesh/output"
    dirs = [os.path.join(output_root, d) for d in os.listdir(output_root)]
    if not dirs:
        return None
    return max(dirs, key=os.path.getmtime)

def get_all_outputs(): 
    output_root ="clipmesh/output"
    dirs = [d for d in os.listdir(output_root) if os.path.isdir(os.path.join(output_root, d))]
    dirs = sorted(dirs, key=lambda d: os.path.getmtime(os.path.join(output_root, d)), reverse=True) 
    return dirs

def get_all_outputs_and_mesh():
    output_root = os.path.join(settings.BASE_DIR, "clipmesh", "output")
    results = []

    if not os.path.exists(output_root):
        return results

    folders = sorted(
        [
            d for d in os.listdir(output_root)
            if os.path.isdir(os.path.join(output_root, d))
        ],
        key=lambda d: os.path.getmtime(os.path.join(output_root, d)),
        reverse=True
    )

    for folder in folders:
        mesh_file = os.path.join(output_root, folder, "meshes", "mesh_0", "mesh.obj")
        mtl_file  = os.path.join(output_root, folder, "meshes", "mesh_0", "mesh.mtl")

        if not os.path.exists(mesh_file) or not os.path.exists(mtl_file):
            continue

        results.append({
            "folder": folder,          # dùng cho URL
            "name": folder,            # hiển thị
            "mesh": f"/media/{folder}/meshes/mesh_0/mesh.obj",
            "mtl":  f"/media/{folder}/meshes/mesh_0/mesh.mtl",
        })

    return results