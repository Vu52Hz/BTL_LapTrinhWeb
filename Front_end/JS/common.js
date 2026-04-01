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
  // Tự động chèn Modal vào mọi trang
  const modalHtml = `
    <div id="modalBorrow" class="modal-overlay">
        <div class="modal-card" style="width:600px">
            <span class="modal-card__close" onclick="closeModal('modalBorrow')">&times;</span>
            <div class="modal-card__title">ĐƠN ĐĂNG KÝ MƯỢN</div>
            <div class="modal-card__body">
                <input type="text" id="readerUsername" class="input-field" placeholder="Username người mượn...">
                <div style="display:flex; gap:10px">
                    <input type="text" id="readerName" class="input-field" style="flex:1" placeholder="Họ tên" readonly>
                    <input type="text" id="readerPhone" class="input-field" style="flex:1" placeholder="SĐT" readonly>
                </div>
                <select id="readerRoom" class="input-field"></select>
                <div class="borrow-search-wrapper" style="position:relative; margin-top:10px">
                    <input type="text" id="modalBookSearch" class="input-field" placeholder="Tìm thêm sách..." oninput="searchBooksInModal()">
                    <div id="modalBookSearchResult" class="borrow-result-popup"></div>
                </div>
                <div id="selectedBooksDisplay" class="selected-books-list" style="max-height:150px; overflow-y:auto; margin-top:10px; border:1px solid #ddd; padding:10px;"></div>
            </div>
            <button class="btn-submit" onclick="submitBorrowRequest()">Xác nhận mượn</button>
        </div>
    </div>
  
    <div id="modalActiveOrder" class="modal-overlay">
        <div class="modal-card">
            <span class="modal-card__close" onclick="closeModal('modalActiveOrder')">&times;</span>
            <div class="modal-card__title">ĐƠN ĐANG SỬ DỤNG</div>
            <div class="modal-card__body"><div id="activeOrderDetail"></div></div>
            <div style="padding:0 30px 30px">
                <button class="btn-submit" style="width:100%; background:var(--danger-red);" onclick="handleFinalCheckOut()">Trả phòng & Kết thúc</button>
            </div>
        </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Khởi tạo nút mượn
  if (typeof initBookingStatus === "function") {
    initBookingStatus();
  }

  // 3. Tự động ẩn các nút admin-only có sẵn trong HTML tĩnh
  applyAdminRestrictions();
});

function logout() {
  localStorage.clear();
  window.location.href = "Login.html";
}

async function openProfileModal() {
  // Gọi API lấy thông tin mới nhất từ BE thay vì dùng LocalStorage
  const res = await fetch(`${API_URL}/users/me`, { headers: getHeaders() });
  const user = (await res.json()).result;

  document.getElementById("profileName").value = user.fullName || "";
  document.getElementById("profilePhone").value = user.phone || "";
  document.getElementById("modalUserProfile").classList.add("is-open");
}

function getUserRole() {
  const user = JSON.parse(localStorage.getItem("library_login")); // Hoặc nơi bạn lưu user info
  return user ? user.role : null;
}

// common.js

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
