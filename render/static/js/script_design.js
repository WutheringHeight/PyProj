document.addEventListener('DOMContentLoaded', () => {
    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.getElementById('rightSidebar');
    const toggleLeftBtn = document.getElementById('toggleLeft');
    const toggleRightBtn = document.getElementById('toggleRight');
    const openLeftBtn = document.getElementById('openLeftBtn');
    const openRightBtn = document.getElementById('openRightBtn');
    
    const bottomLeftCtrl = document.getElementById('bottomLeftCtrl');
    const bottomRightCtrl = document.getElementById('bottomRightCtrl');
    
    const toolItems = document.querySelectorAll('.tool-icon-item');
    const viewModeBtns = document.querySelectorAll('.mode-btn');

    // Logic chọn công cụ trái
    toolItems.forEach(item => {
        item.addEventListener('click', () => {
            toolItems.forEach(t => t.classList.remove('active'));
            item.classList.add('active');
            console.log('Chọn công cụ:', item.getAttribute('data-label'));
        });
    });

    //Logic chọn chế độ xem 2D/3D 
    viewModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    //Xử lý Sidebar Trái
    function updateLeftLayout(isCollapsed) {
        if (isCollapsed) {
            leftSidebar.classList.add('collapsed');
            openLeftBtn.style.display = 'flex';
            bottomLeftCtrl.style.left = '20px';
        } else {
            leftSidebar.classList.remove('collapsed');
            openLeftBtn.style.display = 'none';
             bottomLeftCtrl.style.left = '20px'; 
        }
    }

    toggleLeftBtn.addEventListener('click', () => updateLeftLayout(true));
    openLeftBtn.addEventListener('click', () => updateLeftLayout(false));

    // Xử lý Sidebar Phải
    function updateRightLayout(isCollapsed) {
        if (isCollapsed) {
            rightSidebar.classList.add('collapsed');
            openRightBtn.style.display = 'flex';
            bottomRightCtrl.style.right = '20px';
        } else {
            rightSidebar.classList.remove('collapsed');
            openRightBtn.style.display = 'none';
            bottomRightCtrl.style.right = '20px';
        }
    }

    toggleRightBtn.addEventListener('click', () => updateRightLayout(true));
    openRightBtn.addEventListener('click', () => updateRightLayout(false));

    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
        }
    });
    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            console.log('Undo');
            e.preventDefault();
        }
    });

    // Init state
    console.log('Giao diện House Designer đã tải.');
});