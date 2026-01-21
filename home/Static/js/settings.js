document.addEventListener("DOMContentLoaded", function() {
    const themeToggle = document.getElementById("themeToggle");
    const body = document.body;

    if (body.classList.contains("dark-mode") && themeToggle) {
        themeToggle.checked = true;
    }

    // Xử lý gạt nút
    if (themeToggle) {
        themeToggle.addEventListener("change", function() {
            if (this.checked) {
                body.classList.add("dark-mode");
                localStorage.setItem("appTheme", "dark");
            } else {
                body.classList.remove("dark-mode");
                localStorage.setItem("appTheme", "light");
            }
        });
    }
//lưu đơn vị
    if (unitSelect) {
        unitSelect.addEventListener("change", function() {
            const selectedUnit = this.value;
            localStorage.setItem("appUnit", selectedUnit);
            alert("Đã lưu đơn vị đo lường: " + selectedUnit);
        });
    }
});