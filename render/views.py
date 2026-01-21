import zipfile
from django.utils import timezone
import os
import json
import shutil
import subprocess
from django.conf import settings
from django.shortcuts import render, redirect
from django.http import JsonResponse,HttpResponse
from django.contrib.auth.decorators import login_required
from gallery.models  import MeshObject


@login_required(login_url='/login/')
def design_manual(request, folder=None):
    mesh = None
    mtl = None
    output = None

    base_output = os.path.join(settings.BASE_DIR, "clipmesh", "output")
    if request.method == "POST":
        name = request.POST.get("name").strip()
        obj_file = request.FILES.get("obj_file")
        mtl_file = request.FILES.get("mtl_file")
        textures = request.FILES.getlist("textures")


        user_folder = os.path.join(base_output, name, "meshes", "mesh_0")
        os.makedirs(user_folder, exist_ok=True)

        # Lưu OBJ
        with open(os.path.join(user_folder, "mesh.obj"), "wb+") as f:
            for chunk in obj_file.chunks():
                f.write(chunk)

        # Lưu MTL 
        with open(os.path.join(user_folder, "mesh.mtl"), "wb+") as f:
            for chunk in mtl_file.chunks():
                f.write(chunk)

        # Lưu texture
        for tex in textures:
            with open(os.path.join(user_folder, tex.name), "wb+") as f:
                for chunk in tex.chunks():
                    f.write(chunk)

        # Lưu DB 
        MeshObject.objects.create(
            name=name,
            owner=request.user,
            folder=name
        )

        return redirect("design_manual")
    if folder:
        mesh = f"/media/{folder}/meshes/mesh_0/mesh.obj"
        mtl  = f"/media/{folder}/meshes/mesh_0/mesh.mtl"
        output = folder

    all_outputs = MeshObject.objects.filter(
        owner=request.user
    ).order_by("-created_at")

    return render(request, "manual.html", {
        "output": output,
        "mesh": mesh,
        "mtl": mtl,
        "all_outputs": all_outputs,
    })

@login_required(login_url='/login/')
def design_ai(request,folder=None):
    mesh = None
    mtl = None
    output = None

    if request.method == "POST":
        prompt = request.POST.get("prompt")
        #  clipmesh
        cmd = [
            "python", "clipmesh/main.py",
            "--config", "clipmesh/configs/fast.yml",
            "--text_prompt", prompt
        ]
        subprocess.run(cmd, check=True)

        # Lấy output mới nhất
        output_dir = get_latest_output()
        folder_name = os.path.basename(output_dir)

        # Lưu DB
        MeshObject.objects.create(
            owner=request.user, 
            name=prompt,
            prompt=prompt,
            folder=folder_name
        )

        # Trả cho JS (Three.js)
        mesh = f"/media/{folder_name}/meshes/mesh_0/mesh.obj"
        mtl = f"/media/{folder_name}/meshes/mesh_0/mesh.mtl"

        return JsonResponse({
            "mesh": mesh,
            "mtl": mtl,
            "folder": folder_name
        })


    if folder:
        output_dir = os.path.join(
            settings.BASE_DIR, "clipmesh", "output", folder
        )

        if os.path.exists(output_dir):
            mesh = f"/media/{folder}/meshes/mesh_0/mesh.obj"
            mtl = f"/media/{folder}/meshes/mesh_0/mesh.mtl"
            output = folder

    # Danh sách output của user
    all_outputs = MeshObject.objects.filter(
        owner=request.user
    ).order_by("-created_at")

    return render(request, "ai.html", {
        "output": output,
        "mesh": mesh,
        "mtl": mtl,
        "all_outputs": all_outputs,
    })
    
@login_required(login_url='/login/')
def design_default(request, folder=None):
    mesh = None
    mtl = None
    output = folder
    
    folder = folder or request.GET.get("folder")
    if folder:
        output_dir = os.path.join(settings.BASE_DIR, "clipmesh", "output", folder)
        if os.path.exists(output_dir):
            mesh = f"/media/{folder}/meshes/mesh_0/mesh.obj"
            mtl  = f"/media/{folder}/meshes/mesh_0/mesh.mtl"
            output = folder
            
    base_output = os.path.join(settings.BASE_DIR, "clipmesh", "output")

    if request.method == "POST":

        name = request.POST.get("name")
        source_folder = request.POST.get("source_folder")

        if not name or not source_folder:
            return JsonResponse({"error": "Thiếu tên hoặc source_folder"}, status=400)


        source_path = os.path.join(base_output, source_folder)
        if not os.path.exists(source_path):
            return JsonResponse({"error": "Source folder không tồn tại"}, status=404)


        user_folder_name = f"{name}_{request.user.username}"
        user_folder = os.path.join(base_output, user_folder_name)
        if os.path.exists(user_folder):
            return JsonResponse({"error": "Tên output đã tồn tại"}, status=400)


        shutil.copytree(source_path, user_folder)

        MeshObject.objects.create(
            name=name,
            owner=request.user,
            folder=os.path.relpath(user_folder, base_output),
            created_at=timezone.now()
        )

        return JsonResponse({"success": True, "folder": os.path.relpath(user_folder, base_output)})


    if folder:
        output_dir = os.path.join(base_output, folder)
        if os.path.exists(output_dir):
            mesh = f"/media/{folder}/meshes/mesh_0/mesh.obj"
            mtl = f"/media/{folder}/meshes/mesh_0/mesh.mtl"


    all_outputs = MeshObject.objects.filter(owner=request.user).order_by("-created_at")

    default_objects = MeshObject.objects.filter(is_default=True).order_by("name")

    return render(request, "default.html", {
        "output": output,
        "mesh": mesh,
        "mtl": mtl,
        "all_outputs": all_outputs,
        "default_objects": default_objects,
    })

def delete_output(request, folder_name):
    if request.method == "POST":
        # Xóa thư mục
        output_path = os.path.join(
            settings.BASE_DIR,
            "clipmesh",
            "output",
            folder_name
        )

        if os.path.exists(output_path):
            shutil.rmtree(output_path)

        # Xóa record trong DB
        MeshObject.objects.filter(
            owner=request.user,
            folder=folder_name
        ).delete()

    return redirect("home")



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

@login_required
def download_output(request, folder):
    base_output = os.path.join(settings.BASE_DIR, "clipmesh", "output")

    target_dir = os.path.join(
        base_output,
        folder,
        "meshes",
        "mesh_0"
    )

    zip_name = f"{folder}_mesh.zip"

    response = HttpResponse(content_type="application/zip")
    response["Content-Disposition"] = f'attachment; filename="{zip_name}"'

    with zipfile.ZipFile(response, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(target_dir):
            for file in files:
                full_path = os.path.join(root, file)

                arcname = os.path.relpath(
                    full_path,
                    os.path.join(base_output, folder)
                )

                zipf.write(full_path, arcname)

    return response