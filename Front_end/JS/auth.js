const API_URL = "http://localhost:8080/api/v1/auth";

/**
 * Hiện/Ẩn mật khẩu bằng checkbox
 */
function togglePassword(inputId) {
  const passwordInput = document.getElementById(inputId);
  if (passwordInput) {
    passwordInput.type =
      passwordInput.type === "password" ? "text" : "password";
  }
}

/**
 * Chuyển đổi hiển thị giữa form Đăng ký và Đăng nhập
 */
function toggleAuthForm() {
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  if (registerForm && loginForm) {
    registerForm.classList.toggle("hidden");
    loginForm.classList.toggle("hidden");
  }
}

// --- CHỨC NĂNG ĐĂNG KÝ ---
async function handleRegister() {
  const fullName = document.getElementById("reg-fullname").value;
  const email = document.getElementById("reg-email").value;
  const phone = document.getElementById("reg-phone").value;
  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;

  if (!username || !password || !email) {
    alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
    return;
  }

  const requestBody = { username, email, phone, fullName, password };

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      alert("Đăng ký thành công! Hãy đăng nhập.");
      toggleAuthForm();
    } else {
      const error = await response.json();
      alert("Lỗi: " + (error.message || "Đăng ký thất bại"));
    }
  } catch (err) {
    console.error(err);
    alert("Không thể kết nối tới Server!");
  }
}

// --- CHỨC NĂNG ĐĂNG NHẬP ---
async function handleLogin() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    alert("Vui lòng nhập tên đăng nhập và mật khẩu!");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();

      // Lấy đối tượng result ra để dùng cho tiện
      const userInfo = data.result;

      localStorage.setItem("token", userInfo.token);
      localStorage.setItem("username", userInfo.username);
      localStorage.setItem("fullname", userInfo.fullName);
      localStorage.setItem("roles", JSON.stringify(userInfo.roles));

      alert("Đăng nhập thành công!");

      const isAdmin = userInfo.roles.some((r) => r.authority === "ROLE_ADMIN");
      window.location.href = isAdmin
        ? "/Front_end/HTML/TrangChu.html"
        : "/Front_end/HTML/TrangChu.html";
    } else {
      alert("Sai tên đăng nhập hoặc mật khẩu!");
    }
  } catch (err) {
    console.error(err);
    alert("Lỗi kết nối Server!");
  }
}

// Khởi tạo sự kiện
document.addEventListener("DOMContentLoaded", () => {
  const btnRegister = document.querySelector("#register-form .btn-submit");
  const btnLogin = document.querySelector("#login-form .btn-submit");

  if (btnRegister) btnRegister.onclick = handleRegister;
  if (btnLogin) btnLogin.onclick = handleLogin;
});
