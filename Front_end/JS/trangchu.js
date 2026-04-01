let selectedBooks = [];
let currentActiveBooking = null; // Biến toàn cục lưu thông tin đơn mượn đang hoạt động của người dùng

// --- 1. KHỞI TẠO TRANG ---
document.addEventListener("DOMContentLoaded", async () => {
  // Lấy trạng thái mượn trước để cập nhật nút, sau đó tải các thành phần khác
  await checkUserStatus();
  renderLibraryInfo();
  renderHomeRooms();
  renderTopBorrowedBooks();
  renderSelectedBooks();
});

// --- 2. KIỂM TRA TRẠNG THÁI NGƯỜI DÙNG ---
// --- KIỂM TRA TRẠNG THÁI NGƯỜI DÙNG (Cập nhật logic hiển thị nút) ---
async function checkUserStatus() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    const isAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");
    const isHomePage =
      window.location.pathname.includes("TrangChu.html") ||
      window.location.pathname === "/";

    // Lấy đơn mượn hiện tại
    currentActiveBooking = await getMyActiveBooking();

    // 1. Tìm nút Action chính (thường nằm ở Header hoặc Floating Button để xuất hiện mọi trang)
    const btnMain = document.getElementById("btnMainAction");
    if (btnMain) {
      // Logic hiển thị: Admin chỉ thấy ở Trang chủ, User thấy ở mọi nơi
      if (isAdmin && !isHomePage) {
        btnMain.style.display = "none";
      } else {
        btnMain.style.display = "block";
        if (currentActiveBooking) {
          btnMain.innerText = "Xem đơn mượn";
          btnMain.classList.add("btn-warning"); // Thêm class màu cảnh báo
          btnMain.onclick = openActiveOrderModal;
        } else {
          btnMain.innerText = "Tạo đơn mượn nhanh";
          btnMain.classList.remove("btn-warning");
          btnMain.onclick = () => openBorrowModal();
        }
      }
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái mượn:", error);
  }
}

// --- HÀM TÌM NGƯỜI DÙNG DÀNH CHO ADMIN ---
async function checkAndPopulateUser(username) {
  if (!username) return;

  try {
    // Gọi API lấy thông tin user theo username (Đã có trong UserController của bạn)
    const response = await fetch(`${API_URL}/users/search/${username}`, {
      headers: getHeaders(),
    });
    const data = await response.json();

    if (response.ok && data.result) {
      const user = data.result;
      document.getElementById("readerName").value = user.fullName || "N/A";
      document.getElementById("readerPhone").value = user.phone || "N/A";
      // Lưu ID người mượn thực tế vào thuộc tính của modal để gửi đi sau này
      document
        .getElementById("modalBorrow")
        .setAttribute("data-user-id", user.id);
    } else {
      alert("Không tìm thấy người dùng này!");
      document.getElementById("readerName").value = "";
      document.getElementById("readerPhone").value = "";
    }
  } catch (error) {
    console.error("Lỗi khi tìm người dùng:", error);
  }
}

function openActiveOrderModal() {
  if (!currentActiveBooking) {
    alert("Bạn hiện không có đơn mượn đang hoạt động.");
    return;
  }

  const detail = document.getElementById("activeOrderDetail");
  if (!detail) return;

  const booksHtml = (currentActiveBooking.borrowedBooks || [])
    .map(
      (b) =>
        `<li>${b.title} (${b.status === "READING" ? "Đang đọc" : "Đã trả"})</li>`,
    )
    .join("");

  detail.innerHTML = `
    <p><strong>Người mượn:</strong> ${currentActiveBooking.userName || "N/A"}</p>
    <p><strong>Phòng:</strong> ${currentActiveBooking.roomName || "N/A"}</p>
    <p><strong>Thời gian:</strong> ${new Date(currentActiveBooking.startTime).toLocaleString()}</p>
    <p><strong>Sách:</strong></p>
    <ul>${booksHtml}</ul>
  `;

  document.getElementById("modalActiveOrder")?.classList.add("is-open");
}

async function handleFinalCheckOut() {
  if (!currentActiveBooking) {
    alert("Không có đơn mượn để trả.");
    return;
  }

  if (!confirm("Xác nhận trả phòng và tất cả sách?")) return;

  try {
    const res = await fetch(
      `${API_URL}/bookings/${currentActiveBooking.id}/checkout`,
      {
        method: "PUT",
        headers: getHeaders(),
      },
    );

    const result = await res.json();

    if (res.ok) {
      alert("Đã trả phòng thành công.");
      currentActiveBooking = null;
      closeModal("modalActiveOrder");
      checkUserStatus();
      renderHomeRooms();
      renderTopBorrowedBooks();
    } else {
      alert("Lỗi: " + (result.message || "Không thể trả phòng"));
    }
  } catch (error) {
    console.error("Lỗi khi trả phòng:", error);
    alert("Lỗi kết nối server.");
  }
}

// --- 3. RENDER TRANG CHỦ ---
async function renderLibraryInfo() {
  const container = document.getElementById("libraryInfoContainer");
  if (!container) return;

  try {
    const info = await getLibraryInfo(); // Gọi API getLibraryInfo()
    container.innerHTML = `
      <section class="library-info-card">
          <h2>${info.name}</h2>
          <p><b>Địa chỉ:</b> ${info.address}</p>
          <p><b>Hotline:</b> ${info.hotline} | <b>Làm việc:</b> ${info.workingHours}</p>
          <p><i>${info.description}</i></p>
          <button class="btn-action admin-only" onclick="alert('Chức năng đang phát triển!')">Sửa thông tin</button>
      </section>`;
  } catch (error) {
    console.error("Lỗi tải thông tin thư viện:", error);
  }
}

async function renderHomeRooms() {
  const container = document.getElementById("homeRoomList");
  if (!container) return;

  try {
    const rooms = await getAllRooms(); // Gọi API getAllRooms()
    container.innerHTML = rooms
      .map((r) => {
        const imgUrl = r.imageUrl
          ? `http://localhost:8080${r.imageUrl}`
          : "/Front_end/img/logo.jpg";
        return `
            <div class="card-item">
                <img src="${imgUrl}" class="card-item__img">
                <div class="card-item__info">
                    <h3>${r.name}</h3>
                    <p>Còn Trống: <strong>${r.availableSlots || 0}/${r.capacity || 0}</strong></p> 
                    <p>Ghi chú: ${r.note || "Không có"}</p>
                    <button class="btn-action" onclick="quickBorrowRoom(${r.id})">Đăng ký phòng</button>
                </div>
            </div>`;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi tải danh sách phòng:", error);
  }
}

async function renderFeaturedBooks() {
  const container = document.getElementById("featuredBooks");
  const titleElement = document.getElementById("featuredTitle"); // Lấy thẻ tiêu đề
  const kw = document.getElementById("homeSearch").value.toLowerCase().trim();

  // Nếu ô tìm kiếm trống, quay lại hiện Top 10
  if (kw === "") {
    renderTopBorrowedBooks();
    return;
  } else {
    titleElement.innerText = `Kết quả tìm kiếm cho "${kw}"`; // Cập nhật tiêu đề khi có từ khóa
  }

  try {
    const books = await getAllBooks(kw); // Gọi API tìm kiếm
    container.innerHTML = books
      .map((b) => {
        const imgUrl = b.imageUrl
          ? `http://localhost:8080${b.imageUrl}`
          : "/Front_end/img/logo.jpg";

        // Tạo phần cột tủ bên phải giống qlsach.js
        const rightColHtml = `
            <div class="card-right-inventory">
                <div style="font-weight:bold; font-size:13px; margin-bottom:8px; color:black;">Vị trí tủ:</div>
                <div class="inventory-list-mini">
                    ${(b.inventoryDetails || [])
                      .map(
                        (inv) => `
                        <div class="inv-item-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>${inv.cabinetName}: <b>${inv.availableInCabinet}/${inv.totalInCabinet}</b></span>
                            <button class="btn-borrow-mini" 
                              ${(inv.availableInCabinet || 0) > 0 ? "" : "disabled"}
                              onclick="handleBookAction(${b.id}, '${b.title.replace(/'/g, "\\'")}', ${inv.inventoryId})">
                              ${(inv.availableInCabinet || 0) > 0 ? "Chọn mượn" : "Hết"}
                            </button>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;

        return `
            <div class="card-item">
                <img src="${imgUrl}" class="card-item__img">
                <div class="card-item__info">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h3 style="color:var(--primary-color); margin-top:0;">${b.title}</h3>
                            <p>Tác giả: <strong>${b.author || "N/A"}</strong> </p>
                            <p>Năm: ${b.year || b.publishYear || "N/A"}</p>
                            <p>Sẵn có: <strong style="color:black">${b.availableQuantity || 0}/${b.totalQuantity || 0}</strong></p>
                        </div>
                        
                        <div>${rightColHtml}</div>
                    </div>
                </div>
            </div>`;
      })
      .join("");

    container.classList.add("book-list-container");
  } catch (error) {
    console.error("Lỗi tìm kiếm:", error);
  }
}

// --- 4. TÌM KIẾM SÁCH TRONG MODAL ---
async function searchBooksInModal() {
  const kw = document.getElementById("modalBookSearch").value.trim();
  const popup = document.getElementById("modalBookSearchResult");

  if (!kw) {
    popup.classList.remove("active");
    return;
  }

  try {
    const matched = await getAllBooks(kw);
    popup.innerHTML = matched
      .map((b) => {
        // Chỉ lấy các tủ còn sách
        const availableInvs = (b.inventoryDetails || []).filter(
          (i) => i.availableInCabinet > 0,
        );

        if (availableInvs.length === 0) return ""; // Không hiện sách hết hàng

        const options = availableInvs
          .map(
            (inv) =>
              `<option value="${inv.inventoryId}">${inv.cabinetName} (Còn ${inv.availableInCabinet}/${inv.totalInCabinet})</option>`,
          )
          .join("");

        return `
                <div class="borrow-item-row" style="display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid #eee;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${b.title}</div>
                        <div style="font-size: 11px; color: #666;">${b.author}</div>
                    </div>
                    <select id="select-inv-${b.id}" class="input-field-sm" style="width: 150px; font-size: 12px;">
                        ${options}
                    </select>
                    <button class="btn-action-sm" onclick="addBookWithCabinet(${b.id}, '${b.title}')">Chọn</button>
                </div>
            `;
      })
      .join("");
    popup.classList.add("active");
  } catch (error) {
    console.error("Lỗi tìm sách:", error);
  }
}

// Hàm bổ trợ để lấy giá trị từ select
function addBookWithCabinet(bookId, bookTitle) {
  const select = document.getElementById(`select-inv-${bookId}`);
  const inventoryId = parseInt(select.value);
  const cabinetName = select.options[select.selectedIndex].text
    .split("(")[0]
    .trim();

  handleBookAction(bookId, `${bookTitle} [${cabinetName}]`, inventoryId);
}

/// Lấy top những cuốn sách được mượn nhiều nhất trong ngày
async function renderTopBorrowedBooks() {
  const container = document.getElementById("featuredBooks");
  if (!container) return;

  try {
    const books = await getTop10BorrowedBooks();
    if (!books || books.length === 0) {
      container.innerHTML = "<p>Hôm nay chưa có dữ liệu mượn sách.</p>";
      return;
    }

    container.innerHTML = books
      .map((b) => {
        const imgUrl = b.imageUrl
          ? `http://localhost:8080${b.imageUrl}`
          : "/Front_end/img/logo.jpg";

        // Tạo phần cột tủ bên phải giống qlsach.js
        const rightColHtml = `
            <div class="card-right-inventory">
                <div style="font-weight:bold; font-size:13px; margin-bottom:8px; color:black;">Vị trí tủ:</div>
                <div class="inventory-list-mini">
                    ${(b.inventoryDetails || [])
                      .map(
                        (inv) => `
                        <div class="inv-item-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>${inv.cabinetName}: <b>${inv.availableInCabinet}/${inv.totalInCabinet}</b></span>
                            <button class="btn-borrow-mini" 
                              ${(inv.availableInCabinet || 0) > 0 ? "" : "disabled"}
                              onclick="handleBookAction(${b.id}, '${b.title.replace(/'/g, "\\'")}', ${inv.inventoryId})">
                              ${(inv.availableInCabinet || 0) > 0 ? "Chọn mượn" : "Hết"}
                            </button>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;

        // Thêm thuộc tính position:relative để thẻ badge-top căn góc chính xác
        return `
            <div class="card-item" style="position: relative;">
                <div class="badge-top" style="top: -10px; left: -10px;">Top mượn</div> 
                <img src="${imgUrl}" class="card-item__img">
                <div class="card-item__info">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h3 style="color:var(--primary-color); margin-top:0;">${b.title}</h3>
                            <p>Tác giả: <strong>${b.author || "N/A"}</strong></p>
                            <p>Năm: ${b.year || b.publishYear || "N/A"}</p>
                            <p>Sẵn có: <strong style="color:black">${b.availableQuantity || 0}/${b.totalQuantity || 0}</strong></p>
                        </div>
                        
                        <div>${rightColHtml}</div>
                    </div>
                </div>
            </div>`;
      })
      .join("");

    container.classList.add("book-list-container");
  } catch (error) {
    console.error("Lỗi tải Top 10:", error);
  }
}

// --- 5. QUẢN LÝ SÁCH CHỌN MƯỢN (Local State) ---
// Thêm 2 hàm hỗ trợ đọc/ghi LocalStorage
function getSelectedBooks() {
  return JSON.parse(localStorage.getItem("selectedBooks") || "[]");
}

function saveSelectedBooks(books) {
  localStorage.setItem("selectedBooks", JSON.stringify(books));
}

function toggleBookSelection(id, title, isChecked) {
  let books = getSelectedBooks();
  if (isChecked) {
    if (!books.find((x) => x.id === id)) {
      books.push({ id, title });
    }
  } else {
    books = books.filter((x) => x.id !== id);
  }
  saveSelectedBooks(books);
  renderSelectedBooks();
}

function renderSelectedBooks() {
  const container = document.getElementById("selectedBooksDisplay");
  if (!container) return;

  let books = getSelectedBooks();

  if (books.length === 0) {
    container.innerHTML = `<p style="font-size: 13px; color: #888;">Chưa có sách nào được chọn...</p>`;
    return;
  }
  container.innerHTML = books
    .map(
      (b) => `
        <div class="selected-book-item">
            <span>${b.title}</span>
            <span onclick="removeBook(${b.id})" style="color:red; cursor:pointer; font-weight:bold;">&times;</span>
        </div>
    `,
    )
    .join("");
}

function removeBook(id) {
  let books = getSelectedBooks();
  books = books.filter((x) => x.id !== id);
  saveSelectedBooks(books);

  renderSelectedBooks();
  if (typeof searchBooksInModal === "function") {
    searchBooksInModal(); // Cập nhật lại UI tích xanh nếu đang mở modal
  }
}

function handleBookAction(id, title, inventoryId) {
  if (currentActiveBooking) {
    alert("Bạn đang có một đơn mượn chưa kết thúc!");
    return;
  }
  if (!inventoryId) {
    alert("Sách này hiện đã hết ở tất cả các tủ!");
    return;
  }

  let books = getSelectedBooks();
  const isExisted = books.find((x) => x.inventoryId === inventoryId);

  if (!isExisted) {
    books.push({ id, title, inventoryId });
    saveSelectedBooks(books);
    alert(`Đã thêm "${title}" vào danh sách.`);
  } else {
    alert("Cuốn sách ở tủ này đã được bạn chọn rồi!");
  }
  renderSelectedBooks();
}

// --- 6. XỬ LÝ ĐƠN MƯỢN ---
async function openBorrowModal(defaultRoomId = null) {
  const modal = document.getElementById("modalBorrow");
  if (!modal) return;

  const roles = JSON.parse(localStorage.getItem("roles") || "[]");
  const isAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");

  const inputUsername = document.getElementById("readerUsername");
  const inputFullName = document.getElementById("readerName");
  const inputPhone = document.getElementById("readerPhone");
  const roomSelect = document.getElementById("readerRoom");

  if (isAdmin) {
    // ADMIN: Nhập username để mượn hộ
    inputUsername.value = "";
    inputUsername.readOnly = false;
    inputUsername.placeholder = "Nhập username người mượn...";
    inputUsername.onblur = (e) => checkAndPopulateUser(e.target.value.trim());

    inputFullName.value = "";
    inputFullName.readOnly = true; // Chỉ xem, không sửa trực tiếp

    inputPhone.value = "";
    inputPhone.readOnly = true;
  } else {
    // USER: Fix cứng thông tin bản thân
    inputUsername.value = localStorage.getItem("username") || "";
    inputUsername.readOnly = true;

    inputFullName.value = localStorage.getItem("fullname") || "";
    inputFullName.readOnly = true;

    inputPhone.value = localStorage.getItem("phone") || "N/A";
    inputPhone.readOnly = true;
  }

  // Load danh sách phòng
  if (roomSelect) {
    try {
      const rooms = await getAllRooms();
      console.log("Danh sách phòng nhận được:", rooms);
      if (Array.isArray(rooms)) {
        roomSelect.innerHTML = rooms
          .map((r) => {
            // Thêm thông báo nếu phòng đã hết chỗ
            const isFull = r.availableSlots <= 0;
            return `<option value="${r.id}" 
                            ${r.id == defaultRoomId ? "selected" : ""} 
                            ${isFull ? "disabled" : ""}>
                            ${r.name} ${isFull ? "(Hết chỗ)" : `(Trống: ${r.availableSlots})`}
                        </option>`;
          })
          .join("");
      } else {
        roomSelect.innerHTML =
          "<option value=''>Không có phòng khả dụng</option>";
      }
    } catch (error) {
      console.error("Lỗi tải phòng:", error);
      roomSelect.innerHTML =
        "<option value=''>Không thể tải danh sách phòng</option>";
    }
  }

  renderSelectedBooks();
  modal.classList.add("is-open");
}

function quickBorrowRoom(roomId) {
  if (currentActiveBooking) {
    return alert(
      "Bạn đang có đơn mượn. Vui lòng trả phòng trước khi đăng ký phòng khác!",
    );
  }
  // Mở modal và truyền vào ID phòng để form tự động chọn
  openBorrowModal(roomId);
}

async function submitBorrowRequest() {
  const modal = document.getElementById("modalBorrow");
  const roomId = parseInt(document.getElementById("readerRoom").value);
  const note = document.getElementById("readerNote")?.value || "";

  const roles = JSON.parse(localStorage.getItem("roles") || "[]");
  const isAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");

  let books = getSelectedBooks(); // Lấy từ LocalStorage

  if (!roomId) return alert("Vui lòng chọn phòng!");
  if (books.length === 0) return alert("Vui lòng chọn ít nhất một cuốn sách!");

  const targetUserId = isAdmin ? modal.getAttribute("data-user-id") : null;

  const requestData = {
    roomId: roomId,
    userId: targetUserId,
    inventoryIds: books.map((b) => b.inventoryId || b.id),
    note: note,
  };

  try {
    const res = await fetch(`${API_URL}/bookings/check-in`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(requestData),
    });

    const response = await res.json();
    if (res.ok) {
      alert("Đăng ký mượn sách thành công!");
      localStorage.removeItem("selectedBooks"); // XÓA GIỎ HÀNG SAU KHI MƯỢN XONG
      location.reload();
    } else {
      alert("Lỗi: " + (response.message || "Không thể thực hiện mượn sách"));
    }
  } catch (error) {
    console.error("Lỗi API:", error);
  }
}

// --- 7. SỰ KIỆN KHÁC ---
// Đóng thanh tìm kiếm sách khi click ra ngoài
document.addEventListener("click", (e) => {
  if (!e.target.closest(".borrow-search-wrapper")) {
    document
      .getElementById("modalBookSearchResult")
      ?.classList.remove("active");
  }
});
