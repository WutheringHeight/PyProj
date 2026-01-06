import shutil
from django.http import JsonResponse
import django
from django.conf import settings
import subprocess, os
from django.shortcuts import render, redirect
from django.conf import settings
from .models import Output
from django.http import Http404

def detail(request, folder=None):
    mesh = None
    mtl = None
    output = None

    if request.method == "POST":
        # Chạy Promp
        prompt = request.POST.get("prompt")
        cmd = [
            "python", "clipmesh/main.py",
            "--config", "clipmesh/configs/single.yml",    
            "--text_prompt", prompt
        ]
        subprocess.run(cmd, check=True)

        output_dir = get_latest_output()
        folder_name = os.path.basename(output_dir)

        # DB
        Output.objects.create(
            user=request.user,
            prompt=prompt,
            folder=folder_name
        )
        # Trả JSON cho JS 
        mesh = f"/media/{folder_name}/meshes/mesh_0/mesh.obj" 
        mtl = f"/media/{folder_name}/meshes/mesh_0/mesh.mtl" 
        print("Mesh:", mesh) 
        print("MTL:", mtl) 
        return JsonResponse({"mesh": mesh, "mtl": mtl, "folder": folder_name})

    # Nếu có folder được chọn
    if folder:
        output_dir = os.path.join(settings.BASE_DIR, "clipmesh", "output", folder)
        mesh = f"/media/{folder}/meshes/mesh_0/mesh.obj"
        mtl = f"/media/{folder}/meshes/mesh_0/mesh.mtl"
        output = folder
    
    # Lấy danh sách output của user hiện tại
    if request.user.is_authenticated:
        all_outputs = Output.objects.filter(user=request.user).order_by("-created_at")
    else:
        all_outputs = []

    print("Output:", output) 
    print("Mesh:", mesh) 
    print("MTL:", mtl) 
    print("All outputs:", all_outputs)
    return render(request, "detail.html", {
        "output": output,
        "mesh": mesh,
        "mtl": mtl,
        "all_outputs": all_outputs,
    })
    
def home(request):
    outputs = get_all_outputs_and_mesh()
    return render(request, "home.html",{"outputs":outputs})    

from django.shortcuts import get_object_or_404

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
        Output.objects.filter(
            user=request.user,
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

    # Lấy danh sách folder và sort theo thời gian sửa đổi (mới nhất trước)
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

        # Chỉ thêm output hợp lệ
        if not os.path.exists(mesh_file) or not os.path.exists(mtl_file):
            continue

        results.append({
            "folder": folder,          # dùng cho URL
            "name": folder,            # hiển thị
            "mesh": f"/media/{folder}/meshes/mesh_0/mesh.obj",
            "mtl":  f"/media/{folder}/meshes/mesh_0/mesh.mtl",
        })

    return results
