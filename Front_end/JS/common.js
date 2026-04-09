const API_URL = "http://localhost:8080/api/v1";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

async function getLibraryInfo() {
  return {
    name: "Hệ thống phòng mượn sách My Library",
    address: "Số 123, Đường Láng, Hà Đông, Hà Nội",
    hotline: "0123.456.789",
    workingHours: "8:00 - 21:00(Thứ 2 - Chủ nhật)",
    description: "Không gian đọc sách hiện đại, yên tĩnh với đa dạng đầu sách.",
  };
}

async function getTop10BorrowedBooks() {
  const response = await fetch(`${API_URL}/books/top-borrowed-today`, {
    method: "GET",
    headers: getHeaders(),
  });
  const data = await response.json();
  return data.result || [];
}

// Sửa hàm getAllRooms trong common.js
async function getAllRooms(name = "") {
  // Tạo URL có chứa keyword nếu có
  const url = name
    ? `${API_URL}/rooms?name=${encodeURIComponent(name)}`
    : `${API_URL}/rooms`;

  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();

  // Trả về result từ ApiResponse của Spring Boot
  return data.result || [];
}

async function getAllBooks(keyword = "") {
  const res = await fetch(
    `${API_URL}/books?keyword=${encodeURIComponent(keyword)}`,
    {
      headers: getHeaders(),
    },
  );
  const data = await res.json();
  return data.result || [];
}

async function getMyActiveBooking() {
  const res = await fetch(`${API_URL}/bookings/my-history`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  return (data.result || []).find(
    (b) => b.status === "IN_USE" || b.status === "IN_PROGRESS" || !b.endTime,
  );
}

async function postCheckIn(payload) {
  const res = await fetch(`${API_URL}/bookings/check-in`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return await res.json();
}

async function updateRemoteProfile(payload) {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token && !window.location.pathname.includes("Login.html")) {
    window.location.href = "Login.html";
    return;
  }

  const rolesRaw = localStorage.getItem("roles");
  const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
  const isAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");
  const fullname = localStorage.getItem("fullname") || "Người dùng";

  // Render Header
  const header = document.getElementById("commonHeader");
  if (header) {
    header.innerHTML = `
            <div class="top-header__left">
                <img src="/Front_end/img/logo.jpg" class="header__logo">
                <span class="header__name">My Library</span>
            </div>
            <div class="top-header__right">
                <div class="user-profile-trigger" onclick="openProfileModal()">
                    <span>Chào, <strong>${fullname}</strong></span>
                </div>
                <button onclick="logout()" class="btn-tra-phong">Đăng xuất</button>
            </div>`;
  }

  // Render Sidebar (Phân quyền Admin)
  const sidebar = document.getElementById("sidebarMenu");
  if (sidebar) {
    sidebar.classList.add("header__nav");
    const menu = [
      { n: "Trang Chủ", l: "TrangChu.html" },
      { n: "Quản lý phòng đọc", l: "QLPhongDoc.html" },
      { n: "Quản lý tủ sách", l: "QLTuSach.html" },
      { n: "Quản lý sách", l: "QLSach.html" },
      { n: "Lịch sử", l: "QLLichSu.html" },
      { n: "Quản lý tài khoản", l: "QLTaiKhoan.html", admin: true },
    ];

    // Lấy đường dẫn (path) của trang hiện tại
    const currentPath = window.location.pathname;

    sidebar.innerHTML = menu
      .filter((i) => !i.admin || isAdmin)
      .map((i) => {
        // 2. Kiểm tra nếu URL hiện tại chứa link của menu thì thêm class 'btn--green'
        const isActive = currentPath.includes(i.l) ? "btn--green" : "";
        return `<a href="${i.l}"><button class="btn ${isActive}">${i.n}</button></a>`;
      })
      .join("");
  }
  // Tự động chèn Modal vào mọi trang nếu chưa có
  if (
    !document.getElementById("modalBorrow") ||
    !document.getElementById("modalActiveOrder")
  ) {
    const modalHtml = `
    <div id="modalBorrow" class="modal-overlay">
        <div class="modal-card" style="width: 650px">
            <span class="modal-card__close" onclick="closeModal('modalBorrow')">&times;</span>
            <div class="modal-card__title">ĐƠN ĐĂNG KÝ MƯỢN</div>
            <div class="modal-card__body">
                <div class="modal-card__input-area">
                    <input type="text" id="readerUsername" class="input-field" placeholder="Username người mượn..." />
                    <div style="display: flex; gap: 10px">
                        <input type="text" id="readerName" class="input-field" placeholder="Tên người đọc" style="flex: 1" readonly />
                        <input type="text" id="readerPhone" class="input-field" placeholder="Số điện thoại" style="flex: 1" readonly />
                    </div>
                    <select id="readerRoom" class="input-field"></select>

                    <div class="borrow-search-wrapper" style="position: relative; margin-top: 10px">
                        <input type="text" id="modalBookSearch" class="input-field" placeholder="Tìm tên sách để mượn..." oninput="searchBooksInModal()" />
                        <div id="modalBookSearchResult" class="borrow-result-popup" style="width: 100%; top: 45px"></div>
                    </div>

                    <div id="selectedBooksDisplay" class="selected-books-list" style="max-height: 200px; overflow-y: auto; margin-top: 10px; border: 1px solid #ddd; padding: 10px;">
                        <p style="font-size: 13px; color: #888">Chưa có sách nào được chọn...</p>
                    </div>
                </div>
            </div>
            <button class="btn-submit" onclick="submitBorrowRequest()">Xác nhận mượn</button>
        </div>
    </div>

    <div id="modalActiveOrder" class="modal-overlay">
        <div class="modal-card">
            <span class="modal-card__close" onclick="closeModal('modalActiveOrder')">&times;</span>
            <div class="modal-card__title">ĐƠN MƯỢN HIỆN TẠI</div>
            <div class="modal-card__body">
                <div id="activeOrderDetail" class="modal-card__input-area"></div>
            </div>
            <div style="padding: 0 30px 30px">
                <button class="btn-submit" style="width: 100%; margin: 0; background: var(--danger-red); color: white;" onclick="handleFinalCheckOut()">
                    Trả phòng & Kết thúc
                </button>
            </div>
        </div>
    </div>
    
    <div id="modalUserProfile" class="modal-overlay">
        <div class="modal-card" style="width: 400px;">
            <span class="modal-card__close" onclick="closeModal('modalUserProfile')">&times;</span>
            <div class="modal-card__title">THÔNG TIN CÁ NHÂN</div>
            <div class="modal-card__body">
                <div class="modal-card__input-area">
                    <input type="text" id="profileName" class="input-field" placeholder="Họ và tên" readonly />
                    <input type="text" id="profilePhone" class="input-field" placeholder="Số điện thoại" readonly />
                    <button class="btn-action" style="background: #ffc107; color: #000; border: none; margin-top: 15px; padding: 10px; width: 100%; border-radius: 5px; cursor: pointer; font-weight: bold;" onclick="openChangeMyPasswordModal()">
                        Đổi mật khẩu
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div id="modalChangeMyPassword" class="modal-overlay">
        <div class="modal-card" style="width: 400px;">
            <span class="modal-card__close" onclick="closeModal('modalChangeMyPassword')">&times;</span>
            <div class="modal-card__title">ĐỔI MẬT KHẨU</div>
            <div class="modal-card__body">
                <div class="modal-card__input-area">
                    <input type="password" id="myOldPassword" class="input-field" placeholder="Mật khẩu hiện tại" />
                    <input type="password" id="myNewPassword" class="input-field" placeholder="Mật khẩu mới" />
                    <input type="password" id="myConfirmPassword" class="input-field" placeholder="Nhập lại mật khẩu mới" />
                    <div class="show-password-container" style="margin-top: 10px;">
                        <input type="checkbox" id="check-my-password" onclick="toggleMyPasswordVisibility()" />
                        <label for="check-my-password">Hiển thị mật khẩu</label>
                    </div>
                </div>
            </div>
            <button class="btn-submit" style="margin-top: 15px;" onclick="submitChangeMyPassword()">Xác nhận đổi</button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }

  // Khởi tạo nút mượn
  if (typeof initBookingStatus === "function") {
    initBookingStatus();
  }

  // 3. Tự động ẩn các nút admin-only có sẵn trong HTML tĩnh
  applyAdminRestrictions();
});

// ==========================================
// XỬ LÝ MODAL ĐỔI MẬT KHẨU CÁ NHÂN
// ==========================================

// 1. Mở modal đổi mật khẩu
function openChangeMyPasswordModal() {
  // Xóa trắng các trường nhập liệu trước khi mở
  document.getElementById("myOldPassword").value = "";
  document.getElementById("myNewPassword").value = "";
  document.getElementById("myConfirmPassword").value = "";
  document.getElementById("check-my-password").checked = false;

  // Đặt lại type là password để ẩn ký tự
  document.getElementById("myOldPassword").type = "password";
  document.getElementById("myNewPassword").type = "password";
  document.getElementById("myConfirmPassword").type = "password";

  // Đóng modal profile lại cho gọn màn hình (tùy chọn)
  closeModal("modalUserProfile");

  // Mở modal đổi mật khẩu
  document.getElementById("modalChangeMyPassword").classList.add("is-open");
}

// 2. Tắt/bật hiển thị mật khẩu cho 3 ô input cùng lúc
function toggleMyPasswordVisibility() {
  const isChecked = document.getElementById("check-my-password").checked;
  const type = isChecked ? "text" : "password";

  document.getElementById("myOldPassword").type = type;
  document.getElementById("myNewPassword").type = type;
  document.getElementById("myConfirmPassword").type = type;
}

// 3. Gửi request đổi mật khẩu
async function submitChangeMyPassword() {
  const oldPassword = document.getElementById("myOldPassword").value.trim();
  const newPassword = document.getElementById("myNewPassword").value.trim();
  const confirmPassword = document
    .getElementById("myConfirmPassword")
    .value.trim();

  // Validate Frontend cơ bản
  if (!oldPassword || !newPassword || !confirmPassword) {
    return alert("Vui lòng nhập đầy đủ thông tin!");
  }

  if (newPassword !== confirmPassword) {
    return alert("Mật khẩu mới và mật khẩu xác nhận không khớp!");
  }

  if (newPassword.length < 6) {
    return alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
  }

  try {
    const res = await fetch(`${API_URL}/users/me/change-password`, {
      method: "POST", // Hoặc PUT tùy backend của bạn quy định
      headers: getHeaders(),
      body: JSON.stringify({
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại để tiếp tục.");
      closeModal("modalChangeMyPassword");

      // Bắt user đăng xuất để reset token bằng hàm có sẵn của bạn
      logout();
    } else {
      alert(
        "Lỗi: " +
          (data.message ||
            "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại."),
      );
    }
  } catch (err) {
    console.error(err);
    alert("Lỗi kết nối Server!");
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "Login.html";
}

async function openProfileModal() {
  try {
    const modal = document.getElementById("modalUserProfile");
    if (!modal) {
      alert("Lỗi: Không tìm thấy giao diện Modal Profile trên trang!");
      return;
    }

    // Gọi API lấy thông tin mới nhất từ BE
    const res = await fetch(`${API_URL}/users/me`, { headers: getHeaders() });

    // Nếu token hết hạn hoặc lỗi server
    if (!res.ok) {
      throw new Error(`API trả về mã lỗi: ${res.status}`);
    }

    const data = await res.json();

    // Đề phòng backend của bạn trả về data.data thay vì data.result
    const user = data.result || data.data || {};

    // Gán dữ liệu vào input
    const nameInput = document.getElementById("profileName");
    const phoneInput = document.getElementById("profilePhone");

    if (nameInput) nameInput.value = user.fullName || user.fullname || "";
    if (phoneInput) phoneInput.value = user.phone || "";

    // Mở modal
    modal.classList.add("is-open");
  } catch (error) {
    console.error("Lỗi khi mở modal profile:", error);
    alert(
      "Không thể tải thông tin cá nhân. Mở F12 sang tab Console để xem chi tiết lỗi nhé!",
    );

    // (Tuỳ chọn) Nếu bạn muốn lỗi API mà vẫn ép mở Modal lên để xem giao diện thì bỏ comment dòng dưới:
    // document.getElementById("modalUserProfile").classList.add("is-open");
  }
}

function getUserRole() {
  const user = JSON.parse(localStorage.getItem("library_login"));
  return user ? user.role : null;
}

function isAdmin() {
  const rolesRaw = localStorage.getItem("roles");
  if (!rolesRaw) return false;
  try {
    const roles = JSON.parse(rolesRaw);
    // Kiểm tra chính xác authority từ Spring Boot trả về
    return roles.some((r) => r.authority === "ROLE_ADMIN");
  } catch (e) {
    return false;
  }
}

// Chỉnh sửa hàm này để dùng được nhiều lần
function applyAdminRestrictions() {
  const isUserAdmin = isAdmin();
  const adminElements = document.querySelectorAll(".admin-only");

  adminElements.forEach((el) => {
    if (isUserAdmin) {
      el.style.setProperty("display", "block", "important");
      // Hoặc inline-block tùy vào loại button của bạn
    } else {
      el.style.setProperty("display", "none", "important");
    }
  });
}

////////////////////////////
//***Hàm tiện ích*****//
///////////////////////////
/**
 * Đóng modal bằng cách xóa class 'is-open'
 * @param {string} modalId - ID của phần tử modal (ví dụ: 'modalOverlayRooms')
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("is-open");

    // Reset biến editingRoomId nếu là modal quản lý phòng
    if (modalId === "modalOverlayRooms") {
      editingRoomId = null;
      // Reset form để lần sau mở "Thêm mới" không bị dính dữ liệu cũ
      // const form = modal.querySelector("form");
      // if (form) form.reset();
    }
  }
}

// Hỗ trợ đóng modal khi click ra ngoài vùng card (vùng xám)
window.onclick = function (event) {
  if (event.target.classList.contains("modal-overlay")) {
    event.target.classList.remove("is-open");
  }
};

// Hàm hỗ trợ tăng giảm số lượng trong form
function changeQty(inputId, delta) {
  const input = document.getElementById(inputId);
  if (input) {
    let val = parseInt(input.value) || 0;
    val += delta;
    if (val < 1) val = 1; // Không cho nhỏ hơn 1
    input.value = val;
  }
}

function togglePassword(inputId) {
  const passwordInput = document.getElementById(inputId);
  if (passwordInput) {
    passwordInput.type =
      passwordInput.type === "password" ? "text" : "password";
  }
}
