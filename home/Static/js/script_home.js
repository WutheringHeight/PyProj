document.addEventListener('DOMContentLoaded', () => {
    
    const createBtns = document.querySelectorAll('.create-card, .btn-create-new');
    
    createBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = '/app_design'; 
        });
    });

    // Xử lý filter tags
    const filters = document.querySelectorAll('.filter-tag');
    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            filters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
        });
    });

    // Xử lý Menu Active
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    console.log('Dashboard loaded successfully');
});

document.addEventListener("DOMContentLoaded", function() {
    const notifyBtn = document.getElementById("notifyBtn");
    const notifyDropdown = document.getElementById("notifyDropdown");

    if (notifyBtn && notifyDropdown) {
        
        //nhấn vào nút chuông
        notifyBtn.addEventListener("click", function(event) {
            event.stopPropagation();
            notifyDropdown.classList.toggle("show");
        });

        document.addEventListener("click", function(event) {
            if (!notifyDropdown.contains(event.target) && event.target !== notifyBtn) {
                notifyDropdown.classList.remove("show");
            }
        });
    }
});