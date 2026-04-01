// 1. Hàm Render danh sách người dùng (Bỏ cột Avatar)
async function renderUsers() {
  const kw = document.getElementById("userSearch").value.toLowerCase().trim();
  const container = document.getElementById("userTableBody");

  // Lấy trạng thái từ checkbox
  const showActive = document.getElementById("filterActive").checked;
  const showLocked = document.getElementById("filterLocked").checked;

  try {
    // Lấy tất cả người dùng (Admin có quyền xem hết)
    const res = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await res.json();
    let users = data.result || [];

    // 1. Lọc theo Keyword (nếu có)
    if (kw) {
      users = users.filter(
        (u) =>
          (u.fullName && u.fullName.toLowerCase().includes(kw)) ||
          u.username.toLowerCase().includes(kw),
      );
    }

    // 2. Lọc theo Trạng thái Checkbox
    users = users.filter((u) => {
      if (u.active && showActive) return true;
      if (!u.active && showLocked) return true;
      return false;
    });

    if (users.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align:center;">Không có dữ liệu phù hợp</td></tr>`;
      return;
    }

    container.innerHTML = users
      .map(
        (u) => `
            <tr>
                <td>${u.fullName || "N/A"}</td>
                <td>${u.email || "N/A"}</td>
                <td>${u.phone || "N/A"}</td>
                <td><b>${u.username}</b></td>
                <td><span class="badge">${u.role}</span></td>
                <td>
                   <span class="status-label" style="color:${u.active ? "#198754" : "#dc3545"}; font-weight:bold;">
                      ${u.active ? "● Hoạt động" : "● Bị khóa"}
                   </span>
                </td>
                <td>
                    ${
                      u.active
                        ? `<button class="btn-action-delete" onclick="lockUser(${u.id}, '${u.username}')">Khóa</button>`
                        : `<button class="btn-action" style="background:#198754; border-color:#198754;" onclick="unlockUser(${u.id}, '${u.username}')">Mở khóa</button>`
                    }
                </td>
            </tr>
        `,
      )
      .join("");
  } catch (err) {
    console.error("Lỗi:", err);
    container.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Lỗi kết nối Server!</td></tr>`;
  }
}

// 2. Hàm Lưu tài khoản mới (Admin tạo hộ - Mặc định luôn là USER)
async function saveUser() {
  const fullName = document.getElementById("editFullname").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const phone = document.getElementById("editPhone").value.trim();
  const username = document.getElementById("editUsername").value.trim();
  const password = document.getElementById("editPassword").value.trim();

  // Kiểm tra đầu vào (Khớp với các trường bắt buộc trong form đăng ký)
  if (!fullName || !username || !email || !password) {
    return alert(
      "Vui lòng điền đầy đủ các thông tin: Họ tên, Email, Username và Mật khẩu!",
    );
  }

  const payload = {
    fullName: fullName,
    email: email,
    phone: phone,
    username: username,
    password: password,
  };

  try {
    // Sử dụng chung API Register của AuthController
    // Backend (UserService.java) đã được lập trình để luôn set role = Roles.USER
    const res = await fetch(`http://localhost:8080/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Đã tạo tài khoản Người dùng thành công!");
      closeModal("modalEditUser");
      renderUsers(); // Tải lại danh sách
    } else {
      alert(
        "Lỗi: " +
          (data.message ||
            "Không thể tạo tài khoản. Username hoặc Email có thể đã tồn tại."),
      );
    }
  } catch (err) {
    console.error("Lỗi khi gọi API register:", err);
    alert("Lỗi hệ thống! Vui lòng kiểm tra lại kết nối Backend.");
  }
}

// 3. Hàm Khóa tài khoản (Lock/Delete mềm)
async function lockUser(id, username) {
  // Không cho phép admin tự khóa chính mình (Logic bảo vệ)
  const currentAdmin = localStorage.getItem("username");
  if (username === currentAdmin) {
    return alert("Bạn không thể tự khóa tài khoản của chính mình!");
  }

  if (!confirm(`Bạn có chắc chắn muốn khóa tài khoản "${username}"?`)) return;

  try {
    const res = await fetch(`${API_URL}/users/lock/${id}`, {
      method: "PUT",
      headers: getHeaders(),
    });

    if (res.ok) {
      alert("Đã khóa tài khoản thành công!");
      renderUsers();
    } else {
      const data = await res.json();
      alert(
        "Lỗi: " +
          (data.message ||
            "Không thể khóa tài khoản này (có thể người dùng đang có đơn mượn chưa trả)."),
      );
    }
  } catch (err) {
    alert("Lỗi kết nối Server!");
  }
}

// 4. Mở khóa tài khoản
async function unlockUser(id, username) {
  if (!confirm(`Bạn có chắc chắn muốn mở khóa tài khoản "${username}"?`))
    return;

  try {
    const res = await fetch(`${API_URL}/users/unlock/${id}`, {
      method: "PUT",
      headers: getHeaders(),
    });

    if (res.ok) {
      alert("Đã mở khóa tài khoản thành công!");
      renderUsers(); // Reload lại danh sách
    } else {
      const data = await res.json();
      alert("Lỗi: " + (data.message || "Không thể mở khóa"));
    }
  } catch (err) {
    alert("Lỗi hệ thống!");
  }
}

// 5. Mở Modal và xóa trắng form
function openUserModal() {
  const fields = [
    "editFullname",
    "editEmail",
    "editPhone",
    "editUsername",
    "editPassword",
  ];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  document.getElementById("userModalTitle").innerText = "THÊM TÀI KHOẢN MỚI";
  document.getElementById("modalEditUser").classList.add("is-open");
}

// 5. Lắng nghe sự kiện tìm kiếm khi người dùng nhập liệu
document.addEventListener("DOMContentLoaded", () => {
  // Load danh sách lần đầu
  renderUsers();

  // Gán sự kiện cho ô tìm kiếm (nếu có id là userSearch)
  const searchInput = document.getElementById("userSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      // Debounce đơn giản để tránh gọi API quá nhiều lần
      clearTimeout(window.searchTimer);
      window.searchTimer = setTimeout(renderUsers, 500);
    });
  }
});
