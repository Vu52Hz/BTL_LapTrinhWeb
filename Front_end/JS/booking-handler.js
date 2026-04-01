/**
 * BOOKING HANDLER - Module xử lý mượn sách dùng chung cho toàn bộ hệ thống
 */

window.currentActiveBooking = null;

function getSelectedBooks() {
  return JSON.parse(localStorage.getItem("selectedBooks") || "[]");
}

function saveSelectedBooks(books) {
  localStorage.setItem("selectedBooks", JSON.stringify(books));
}

function clearSelectedBooks() {
  localStorage.removeItem("selectedBooks");
}

// 1. Khởi tạo trạng thái nút mượn (Gọi mỗi khi load trang)
async function initBookingStatus() {
  window.selectedBooks = getSelectedBooks();
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Lấy đơn mượn hiện tại từ common.js (hàm getMyActiveBooking đã có)
    window.currentActiveBooking = await getMyActiveBooking();

    const btnMain = document.getElementById("btnMainAction");
    if (btnMain) {
      const roles = JSON.parse(localStorage.getItem("roles") || "[]");
      const isAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");
      const path = window.location.pathname.toLowerCase();
      const isHomePage =
        path.endsWith("trangchu.html") || path.endsWith("/") || path === "";

      // Logic hiển thị: Admin chỉ thấy ở Trang chủ, User thấy ở mọi nơi
      if (isAdmin && !isHomePage) {
        btnMain.style.display = "none";
      } else {
        btnMain.style.display = "block";
        if (window.currentActiveBooking) {
          btnMain.innerText = "Xem đơn mượn";
          btnMain.style.background = "#ffc107";
          btnMain.onclick = openActiveOrderModal;
        } else {
          btnMain.innerText = "Tạo đơn mượn";
          btnMain.style.background = "";
          btnMain.onclick = () => openBorrowModal();
        }
      }
    }

    // Render selected books nếu có
    if (typeof renderSelectedBooks === "function") {
      renderSelectedBooks();
    }
  } catch (error) {
    console.error("Lỗi khởi tạo trạng thái mượn:", error);
  }
}

// 2. Mở Modal đơn mượn hiện tại
function openActiveOrderModal() {
  if (!window.currentActiveBooking) return;

  const detail = document.getElementById("activeOrderDetail");
  if (!detail) return;

  const booksHtml = (window.currentActiveBooking.borrowedBooks || [])
    .map(
      (b) =>
        `<li>${b.title} (${b.status === "READING" ? "Đang đọc" : "Đã trả"})</li>`,
    )
    .join("");

  detail.innerHTML = `
        <p><strong>Người mượn:</strong> ${window.currentActiveBooking.userName || "N/A"}</p>
        <p><strong>Phòng:</strong> ${window.currentActiveBooking.roomName || "N/A"}</p>
        <p><strong>Bắt đầu:</strong> ${new Date(window.currentActiveBooking.startTime).toLocaleString()}</p>
        <p><strong>Sách đang giữ:</strong></p>
        <ul style="padding-left:20px">${booksHtml}</ul>
    `;
  document.getElementById("modalActiveOrder")?.classList.add("is-open");
}

// 3. Kết thúc đơn mượn (Checkout)
async function handleFinalCheckOut() {
  if (!window.currentActiveBooking) return;
  if (!confirm("Xác nhận trả phòng và tất cả sách?")) return;

  try {
    const res = await fetch(
      `${API_URL}/bookings/${window.currentActiveBooking.id}/checkout`,
      {
        method: "PUT",
        headers: getHeaders(),
      },
    );
    if (res.ok) {
      alert("Đã hoàn tất trả phòng.");
      location.reload();
    } else {
      const result = await res.json();
      alert("Lỗi: " + result.message);
    }
  } catch (error) {
    alert("Lỗi kết nối server.");
  }
}

// 4. Mở Modal tạo đơn mượn mới
async function openBorrowModal(defaultRoomId = null) {
  const modal = document.getElementById("modalBorrow");
  if (!modal) return;

  const roles = JSON.parse(localStorage.getItem("roles") || "[]");
  const isAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");

  // Setup form info
  const inputUsername = document.getElementById("readerUsername");
  const inputFullName = document.getElementById("readerName");
  const inputPhone = document.getElementById("readerPhone");
  const roomSelect = document.getElementById("readerRoom");

  if (isAdmin) {
    if (inputUsername) {
      inputUsername.value = "";
      inputUsername.readOnly = false;
      inputUsername.onblur = (e) => checkAndPopulateUser(e.target.value.trim());
    }
    if (inputFullName) inputFullName.value = "";
    if (inputPhone) inputPhone.value = "";
  } else {
    if (inputUsername) {
      inputUsername.value = localStorage.getItem("username") || "";
      inputUsername.readOnly = true;
    }
    if (inputFullName) {
      inputFullName.value = localStorage.getItem("fullname") || "";
      inputFullName.readOnly = true;
    }
    if (inputPhone) {
      inputPhone.value = localStorage.getItem("phone") || "N/A";
      inputPhone.readOnly = true;
    }
  }

  // Tải danh sách phòng
  if (roomSelect) {
    const rooms = await getAllRooms();
    roomSelect.innerHTML = (rooms || [])
      .map(
        (
          r,
        ) => `<option value="${r.id}" ${r.id == defaultRoomId ? "selected" : ""} ${r.availableSlots <= 0 ? "disabled" : ""}>
                ${r.name} ${r.availableSlots <= 0 ? "(Hết chỗ)" : `(Trống: ${r.availableSlots})`}
            </option>`,
      )
      .join("");
  }

  renderSelectedBooks();
  modal.classList.add("is-open");
}

// 5. Tìm kiếm sách trong Modal (Dropdown chọn tủ)
async function searchBooksInModal() {
  const kw = document.getElementById("modalBookSearch").value.trim();
  const popup = document.getElementById("modalBookSearchResult");
  if (!kw) return popup.classList.remove("active");

  try {
    const matched = await getAllBooks(kw);
    popup.innerHTML = matched
      .map((b) => {
        const availableInvs = (b.inventoryDetails || []).filter(
          (i) => i.availableInCabinet > 0,
        );
        if (availableInvs.length === 0) return "";

        const options = availableInvs
          .map(
            (inv) =>
              `<option value="${inv.inventoryId}">${inv.cabinetName} (Còn ${inv.availableInCabinet})</option>`,
          )
          .join("");

        return `
                <div class="borrow-item-row" style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid #eee;">
                    <div style="flex:1"><b>${b.title}</b><br><small>${b.author}</small></div>
                    <select id="select-inv-${b.id}" class="input-field-sm" style="width:130px">${options}</select>
                    <button class="btn-action-sm" onclick="addBookWithCabinet(${b.id}, '${b.title}')">Chọn</button>
                </div>`;
      })
      .join("");
    popup.classList.add("active");
  } catch (e) {
    console.error(e);
  }
}

function addBookWithCabinet(bookId, bookTitle) {
  const select = document.getElementById(`select-inv-${bookId}`);
  const inventoryId = parseInt(select.value);
  const cabinetName = select.options[select.selectedIndex].text
    .split("(")[0]
    .trim();

  // TRUYỀN TÁCH BIỆT TITLE VÀ CABINET NAME
  handleBookAction(bookId, bookTitle, inventoryId, cabinetName);
}

// 6. Xử lý logic mượn chính
async function addMoreBookToActiveBooking(bookingId, inventoryId) {
  if (!confirm("Bạn có muốn thêm sách này vào đơn mượn hiện tại?"))
    return false;
  try {
    const res = await fetch(`${API_URL}/bookings/${bookingId}/add-books`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify([inventoryId]),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Đã thêm sách vào đơn mượn hiện tại.");
      window.currentActiveBooking = await getMyActiveBooking();
      renderSelectedBooks();
      return true;
    }
    alert("Lỗi thêm sách: " + (data.message || "Không xác định"));
    return false;
  } catch (error) {
    alert("Lỗi kết nối server khi thêm sách vào đơn.");
    console.error(error);
    return false;
  }
}

async function handleBookAction(
  id,
  title,
  inventoryId,
  cabinetName = "Chưa rõ vị trí",
) {
  if (!inventoryId) return alert("Hết sách!");

  // Nếu đã có đơn mượn đang dùng, thêm trực tiếp vào đơn của người dùng
  if (window.currentActiveBooking) {
    await addMoreBookToActiveBooking(
      window.currentActiveBooking.id,
      inventoryId,
    );
    return;
  }

  const selected = getSelectedBooks();
  const isExisted = selected.find((x) => x.inventoryId === inventoryId);
  if (isExisted) {
    alert("Cuốn sách ở tủ này đã được bạn chọn rồi!");
    return;
  }

  // LƯU THÊM CABINET NAME VÀO ĐÂY
  selected.push({ id, title, inventoryId, cabinetName });

  saveSelectedBooks(selected);
  window.selectedBooks = selected;
  renderSelectedBooks();
  alert("Đã thêm sách vào danh sách mượn.");
}

function renderSelectedBooks() {
  const container = document.getElementById("selectedBooksDisplay");
  if (!container) return;

  const selected = getSelectedBooks();
  if (selected.length === 0) {
    container.innerHTML = `<p style="font-size:13px; color:#888;">Chưa có sách nào...</p>`;
    return;
  }

  container.innerHTML = selected
    .map(
      (b) => `
        <div class="selected-book-item" style="display:flex; justify-content:space-between; background:#f0f7f4; padding:5px 10px; margin-bottom:5px; border-radius:4px;">
            <div>
                <span>${b.title}</span>
                <br><small style="color:#666;">Tủ: ${b.cabinetName || "N/A"}</small>
            </div>
            <span onclick="removeBook(${b.inventoryId})" style="color:red; cursor:pointer; font-weight:bold;">&times;</span>
        </div>
    `,
    )
    .join("");
}

function removeBook(invId) {
  const selected = getSelectedBooks().filter((x) => x.inventoryId !== invId);
  saveSelectedBooks(selected);
  window.selectedBooks = selected;
  renderSelectedBooks();
}

async function submitBorrowRequest() {
  const roomId = document.getElementById("readerRoom")?.value;
  if (!roomId) return alert("Chọn phòng!");

  const selected = getSelectedBooks();

  // Nếu đang có đơn mượn đang dùng thì thêm vào đơn, không tạo mới
  if (window.currentActiveBooking) {
    if (selected.length === 0) return alert("Chưa có sách nào để thêm!");
    const inventoryIds = selected.map((b) => b.inventoryId);

    const res = await fetch(
      `${API_URL}/bookings/${window.currentActiveBooking.id}/add-books`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(inventoryIds),
      },
    );
    const data = await res.json();
    if (res.ok) {
      alert("Đã thêm sách vào đơn mượn hiện tại.");
      clearSelectedBooks();
      window.selectedBooks = [];
      window.currentActiveBooking = await getMyActiveBooking();
      renderSelectedBooks();
      return;
    }
    return alert("Lỗi: " + (data.message || "Không xác định"));
  }

  if (selected.length === 0) return alert("Chọn sách!");

  const roles = JSON.parse(localStorage.getItem("roles") || "[]");
  const isAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");
  const targetUserId = isAdmin
    ? document.getElementById("modalBorrow").getAttribute("data-user-id")
    : null;

  const payload = {
    roomId: parseInt(roomId),
    userId: targetUserId,
    inventoryIds: selected.map((b) => b.inventoryId),
    note: "Đăng ký từ hệ thống",
  };

  const res = await postCheckIn(payload);
  if (res.code === 1000) {
    alert("Thành công!");
    clearSelectedBooks();
    window.selectedBooks = [];
    window.currentActiveBooking = await getMyActiveBooking();
    renderSelectedBooks();
    closeModal("modalBorrow");
    initBookingStatus();
    return;
  }

  alert("Lỗi: " + res.message);
}

async function checkAndPopulateUser(username) {
  const res = await fetch(`${API_URL}/users/search/${username}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (res.ok && data.result) {
    document.getElementById("readerName").value = data.result.fullName;
    document.getElementById("readerPhone").value = data.result.phone;
    document
      .getElementById("modalBorrow")
      .setAttribute("data-user-id", data.result.id);
  } else alert("Không tìm thấy user!");
}
