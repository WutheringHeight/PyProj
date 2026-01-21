document.addEventListener('DOMContentLoaded', () => {
    // Helper function để lấy phần tử an toàn
    const getEl = (id) => document.getElementById(id);

    // Lấy các phần tử (có thể null nếu không có trong HTML)
    const leftSidebar = getEl('leftSidebar');
    const rightSidebar = getEl('rightSidebar');
    const toggleLeftBtn = getEl('toggleLeft');
    const toggleRightBtn = getEl('toggleRight');
    const openLeftBtn = getEl('openLeftBtn');
    const openRightBtn = getEl('openRightBtn');
    const bottomLeftCtrl = getEl('bottomLeftCtrl');
    const bottomRightCtrl = getEl('bottomRightCtrl');
    
    const toolItems = document.querySelectorAll('.tool-icon-item');
    const viewModeBtns = document.querySelectorAll('.mode-btn');

    // 1. Logic chọn công cụ (nếu có)
    toolItems.forEach(item => {
        item.addEventListener('click', () => {
            toolItems.forEach(t => t.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // 2. Logic chế độ xem
    viewModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 3. Xử lý Sidebar Trái (Chỉ chạy nếu các phần tử tồn tại)
    if (leftSidebar && toggleLeftBtn) {
        toggleLeftBtn.addEventListener('click', () => {
            leftSidebar.classList.add('collapsed');
            if (openLeftBtn) openLeftBtn.style.display = 'flex';
        });
    }

    if (openLeftBtn && leftSidebar) {
        openLeftBtn.addEventListener('click', () => {
            leftSidebar.classList.remove('collapsed');
            openLeftBtn.style.display = 'none';
        });
    }

    // 4. Xử lý Sidebar Phải
    if (rightSidebar && toggleRightBtn) {
        toggleRightBtn.addEventListener('click', () => {
            rightSidebar.classList.add('collapsed');
            if (openRightBtn) openRightBtn.style.display = 'flex';
        });
    }

    if (openRightBtn && rightSidebar) {
        openRightBtn.addEventListener('click', () => {
            rightSidebar.classList.remove('collapsed');
            openRightBtn.style.display = 'none';
        });
    }

    // 5. Dropdown Menu (Sửa lỗi đóng/mở)
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    if (dropdownTrigger) {
        dropdownTrigger.addEventListener('click', (e) => {
            const menu = e.target.nextElementSibling;
            if (menu) menu.classList.toggle('show');
        });
    }

    // 6. Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            // Gọi hàm lưu từ window (vì hàm này nằm trong HTML script tag)
            if (typeof window.saveCurrentProject === 'function') {
                window.saveCurrentProject();
            }
        }
    });

    console.log('Giao diện House Designer đã sẵn sàng.');
});