let userChart = null;

async function renderUserChart() {
  let startDate = document.getElementById("startDate").value;
  let endDate = document.getElementById("endDate").value;

  try {
    // Nếu thiếu startDate hoặc endDate → lấy danh sách user để suy ra
    if (!startDate || !endDate) {
      const resUsers = await fetch(`${API_URL}/users`, {
        headers: getHeaders(),
      });

      const dataUsers = await resUsers.json();
      const users = dataUsers.result || [];

      if (users.length === 0) return;

      // Sắp xếp user theo createdAt
      users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      if (!startDate) {
        const first = new Date(users[0].createdAt);
        startDate = `${first.getFullYear()}-${String(
          first.getMonth() + 1,
        ).padStart(2, "0")}-01`;
        document.getElementById("startDate").value = startDate;
      }

      if (!endDate) {
        const now = new Date();
        // SỬA TẠI ĐÂY: Lấy chính xác ngày hiện tại (YYYY-MM-DD)
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        document.getElementById("endDate").value = endDate;
      }
    }

    // Gọi API thống kê
    const res = await fetch(
      `${API_URL}/users/statistics/monthly?startDate=${startDate}&endDate=${endDate}`,
      { headers: getHeaders() },
    );

    const data = await res.json();
    const stats = data.result || [];

    // Xử lý nhãn tháng: Nếu là cột đầu tiên hoặc tháng 1 thì hiển thị "MM/YYYY", ngược lại chỉ hiển thị "MM"
    const labels = stats.map((s, index) => {
      const year = s.year.toString();
      const month = s.month.toString().padStart(2, "0");

      // Điều kiện: Là cột đầu tiên HOẶC là tháng 1
      if (index === 0 || month === "01" || month === "1") {
        return `${month}/${year}`;
      }

      // Các trường hợp còn lại chỉ hiện số tháng
      return month;
    });

    // const labels = stats.map((s) => `${s.month}`);
    const totalData = stats.map((s) => s.total);
    const activeData = stats.map((s) => s.active);
    const lockedData = stats.map((s) => s.locked);

    const ctx = document.getElementById("userChart");

    if (userChart) userChart.destroy();

    userChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Tổng tài khoản",
            data: totalData,
            backgroundColor: "rgba(13, 110, 253, 0.5)", // Màu xanh dương (nhạt)
            borderColor: "rgb(13, 110, 253)", // Viền xanh dương (đậm)
            borderWidth: 1,
          },
          {
            label: "Hoạt động",
            data: activeData,
            backgroundColor: "rgba(25, 135, 84, 0.5)", // Màu xanh lá
            borderColor: "rgb(25, 135, 84)",
            borderWidth: 1,
          },
          {
            label: "Bị khóa",
            data: lockedData,
            backgroundColor: "rgba(220, 53, 69, 0.5)", // Màu đỏ
            borderColor: "rgb(220, 53, 69)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: {
            display: true,
            text: "Thống kê tài khoản theo tháng",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });
  } catch (err) {
    console.error("Lỗi vẽ biểu đồ:", err);
  }
}

// 1. Hàm Render danh sách người dùng (Đã bổ sung Lọc ngày & Thống kê)
async function renderUsers() {
  const kw = document.getElementById("userSearch").value.toLowerCase().trim();
  const container = document.getElementById("userTableBody");
  const statisticsArea = document.querySelector(".statistics-area");
  const chartArea = document.getElementById("userChart").parentElement;
  if (kw !== "") {
    // Nếu có nhập tìm kiếm -> Ẩn
    if (statisticsArea) statisticsArea.style.display = "none";
    if (chartArea) chartArea.style.display = "none";
  } else {
    // Nếu trống -> Hiện (flex/block tùy layout của bạn)
    if (statisticsArea) statisticsArea.style.display = "flex";
    if (chartArea) chartArea.style.display = "block";
  }

  const showActive = document.getElementById("filterActive").checked;
  const showLocked = document.getElementById("filterLocked").checked;

  // Lấy giá trị ngày A và B
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  try {
    // Truyền ngày lên Backend (Backend cần hỗ trợ nhận 2 param này để trả về trạng thái Lịch sử)
    // Nếu Backend chưa hỗ trợ lọc, nó sẽ trả về toàn bộ và ta lọc tạm ở Frontend (không chính xác về lịch sử)
    let apiUrl = `${API_URL}/users?`;
    if (startDate) apiUrl += `startDate=${startDate}&`;
    if (endDate) apiUrl += `endDate=${endDate}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await res.json();
    let users = data.result || [];

    // --- BỘ LỌC FRONTEND ---

    // Lọc theo khoảng thời gian (Lọc theo ngày tạo)
    if (startDate || endDate) {
      users = users.filter((u) => {
        if (!u.createdAt) return true; // Bỏ qua nếu data cũ không có ngày tạo
        const createdDate = new Date(u.createdAt).setHours(0, 0, 0, 0);
        const start = startDate
          ? new Date(startDate).setHours(0, 0, 0, 0)
          : null;
        const end = endDate
          ? new Date(endDate).setHours(23, 59, 59, 999)
          : null;

        if (start && createdDate < start) return false;
        if (end && createdDate > end) return false;
        return true;
      });
    }

    // Lọc theo Keyword
    if (kw) {
      users = users.filter(
        (u) =>
          (u.fullName && u.fullName.toLowerCase().includes(kw)) ||
          u.username.toLowerCase().includes(kw),
      );
    }

    // --- TÍNH TOÁN THỐNG KÊ (Dựa trên danh sách đã lọc thời gian) ---
    // Lưu ý: Biến u.active lúc này PHẢI LÀ trạng thái do Backend tính toán trả về tính đến ngày endDate.
    let totalUsers = 0;
    let activeUsers = 0;
    let lockedUsers = 0;

    users.forEach((u) => {
      if (u.role !== "ADMIN") {
        // Thường không thống kê admin
        totalUsers++;
        if (u.active) activeUsers++;
        else lockedUsers++;
      }
    });

    // Hiển thị thống kê
    document.getElementById("statTotal").innerText = totalUsers;
    document.getElementById("statActive").innerText = activeUsers;
    document.getElementById("statLocked").innerText = lockedUsers;

    // --- LỌC THEO CHECKBOX TRẠNG THÁI HIỂN THỊ LÊN BẢNG ---
    let displayUsers = users.filter((u) => {
      if (u.role === "ADMIN") return false; // Ẩn Admin
      if (u.active && showActive) return true;
      if (!u.active && showLocked) return true;
      return false;
    });

    if (displayUsers.length === 0) {
      container.innerHTML = `<tr><td colspan="8" style="text-align:center;">Không có dữ liệu phù hợp</td></tr>`;
      return;
    }

    container.innerHTML = displayUsers
      .map((u) => {
        // Format ngày tạo (DD/MM/YYYY)
        const createdDateString = u.createdAt
          ? new Date(u.createdAt).toLocaleDateString("vi-VN")
          : "N/A";

        return `
            <tr>
                <td>${u.fullName || "N/A"}</td>
                <td>${u.email || "N/A"}</td>
                <td>${u.phone || "N/A"}</td>
                <td><b>${u.username}</b></td>
                <td><span class="badge">${u.role}</span></td>
                <td>${createdDateString}</td> <td>
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
        `;
      })
      .join("");
  } catch (err) {
    console.error("Lỗi:", err);
    container.innerHTML = `<tr><td colspan="8" style="color:red; text-align:center;">Lỗi kết nối Server!</td></tr>`;
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

// 6. Lắng nghe sự kiện tìm kiếm khi người dùng nhập liệu
document.addEventListener("DOMContentLoaded", () => {
  // Load danh sách lần đầu
  renderUsers();
  renderUserChart();

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
