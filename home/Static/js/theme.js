
(function() {
    //Lấy cài đặt
    const savedTheme = localStorage.getItem("appTheme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }
})();