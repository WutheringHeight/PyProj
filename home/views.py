from datetime import date
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Project
from .models import UserProfile
from django.http import HttpResponse
from django.contrib.auth import logout


def index(request):
    return render(request, 'home.html')

@login_required(login_url='/login/') # Bắt buộc login
def index(request):
    projects = Project.objects.filter(user=request.user)
    
    context = {
        'user': request.user,
        'projects': projects
    }
    return render(request, 'home.html', context)

@login_required
def create_project(request):
    user_plan = request.user.userprofile.plan
    project_count = Project.objects.filter(user=request.user).count()
    
    limit = 3 if user_plan == 'FREE' else 10 if user_plan == 'BASIC' else 1000
    
    if project_count >= limit:
        messages.error(request, f"Bạn đã đạt giới hạn {limit} dự án của gói {user_plan}. Vui lòng nâng cấp để tạo thêm!")
        return redirect('home_index')
    
    default_name = f"Dự án mới {date.today()}"
    new_project = Project.objects.create(
        user=request.user,
        name=default_name

    )
    return redirect(f'/app_design/?id={new_project.id}')

@login_required
def delete_project(request, project_id):
    #Tìm dự án theo ID, nếu không thấy thì báo lỗi
    project = get_object_or_404(Project, id=project_id)
    #Chỉ xóa nếu dự án này thuộc về người đang đăng nhập
    if project.user == request.user:
        project.delete()

    return redirect('home_index')

def logout_view(request):
    logout(request) #Đăng xuất
    return redirect('landing_page_index')

@login_required
def settings_view(request):
    return render(request, 'settings.html')

@login_required
def upgrade_plan(request):
    if request.method == "POST":
        new_plan = request.POST.get("plan")
        if new_plan in ['FREE', 'BASIC', 'UNLIMITED']:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.plan = new_plan
            profile.save()
            messages.success(request, f"Chúc mừng! Bạn đã nâng cấp lên gói {new_plan} thành công.")
            return redirect('home_index') # Hoặc trang cá nhân của bạn
            
    return render(request, "upgrade.html")