let editingBookId = null;
let selectedBookFile = null;
let currentBookImageUrl = "";
// Mảng lưu trữ các tủ được chọn: [{inventoryId: 1, idCabinet: 1, name: 'Tủ A', quantity: 5}]
let selectedCabinets = [];

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Tải dữ liệu tủ sách để dùng cho Filter và Modal
  await loadCabinetsData();
  // 2. Hiển thị danh sách sách ban đầu
  renderBooksList();
  renderSelectedBooks();

  // 3. Gán sự kiện cho nút lưu
  const btnSave = document.getElementById("btnConfirmBook");
  if (btnSave) {
    btnSave.onclick = saveBook;
  }
});

/**
 * 1. Tải danh sách tủ sách từ Server
 */
async function loadCabinetsData() {
  try {
    const res = await fetch(`${API_URL}/cabinets`, { headers: getHeaders() });
    const data = await res.json();
    // Lưu vào window để truy cập từ mọi hàm
    window.allCabinets = data.result || [];

    const filter = document.getElementById("filterCabinet");
    if (filter) {
      filter.innerHTML =
        `<option value="">-- Tất cả các tủ --</option>` +
        window.allCabinets
          .map((c) => `<option value="${c.id}">${c.ten}</option>`)
          .join("");
    }
  } catch (err) {
    console.error("Lỗi tải danh sách tủ:", err);
  }
}

/**
 * 2. Render danh sách sách (có lọc theo từ khóa và tủ)
 */
async function renderBooksList() {
  const container = document.getElementById("bookList");
  const kw = document
    .getElementById("bookSearchInput")
    .value.trim()
    .toLowerCase();
  const cabId = document.getElementById("filterCabinet").value;

  try {
    // 1. Gọi Api lấy sách theo keyword (API đã hỗ trợ lọc theo keyword và cabinetId)
    let books = await getAllBooks(kw);
    // 2. Lọc theo Cabinet nếu người dùng chọn filter trên giao diện
    if (cabId) {
      books = books.filter((b) =>
        b.inventoryDetails.some((inv) => inv.cabinetId == cabId),
      );
    }
    // Kiểm tra quyền Admin
    const rolesRaw = localStorage.getItem("roles");
    const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
    const isUserAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");

    container.innerHTML = books
      .map((b) => {
        const imgUrl = b.imageUrl
          ? `http://localhost:8080${b.imageUrl}`
          : "/Front_end/img/logo.jpg";

        // Tạo phần cột tủ bên phải cho User
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
                              onclick="handleBookAction(${b.id}, '${b.title}', ${inv.inventoryId}, '${inv.cabinetName}')">
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
                          <h3 style="color:var(--primary-color)">${b.title}</h3>
                          <p>Tác giả: <strong>${b.author || "N/A"}</strong> </p>
                          <p>Năm: ${b.year || "N/A"}</p>
                          <p>Sẵn có: <strong style="color:black">${b.availableQuantity}/${b.totalQuantity}</strong></p>
                        </div>
                        
                        <div>${rightColHtml}</div>
                      </div>

                      <div class="actions">
                          <button class="btn-action admin-only" onclick="openBookModal(${b.id})">Sửa</button>
                          <button class="btn-action-delete admin-only" onclick="deleteBook(${b.id})">Xóa</button>
                      </div>
                  </div>
              </div>`;
      })
      .join("");

    applyAdminRestrictions();
  } catch (err) {
    console.error("Lỗi hiển thị:", err);
  }
}

/**
 * 3. Xử lý Xem trước ảnh (Preview)
 */
function previewBookImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  selectedBookFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById("bookImagePreview");
    img.src = e.target.result;
    img.style.display = "block";
    document.getElementById("bookUploadPlaceholder").style.display = "none";
  };
  reader.readAsDataURL(file);
}

/**
 * 4. Mở Modal (Thêm mới / Chỉnh sửa)
 */
async function openBookModal(id = null) {
  editingBookId = id;
  selectedBookFile = null;
  selectedCabinets = [];

  if (id) {
    // Chế độ chỉnh sửa
    try {
      const res = await fetch(`${API_URL}/books/${id}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      const b = data.result;

      document.getElementById("bookModalTitle").innerText = "Chỉnh sửa sách";
      document.getElementById("bookName").value = b.title;
      document.getElementById("bookAuthor").value = b.author || "";
      document.getElementById("bookYear").value = b.publishYear || b.year || "";
      currentBookImageUrl = b.imageUrl || "";

      // Lấy danh sách inventories của sách này
      const invRes = await fetch(`${API_URL}/book-inventory/book/${id}`, {
        headers: getHeaders(),
      });
      const invData = await invRes.json();
      const inventories = invData.result || [];

      // Chuyển đổi sang mảng selectedCabinets
      selectedCabinets = inventories.map((inv) => ({
        inventoryId: inv.id,
        idCabinet: inv.cabinetId,
        name: inv.cabinetName,
        quantity: inv.totalInCabinet,
      }));

      const imgPreview = document.getElementById("bookImagePreview");
      if (currentBookImageUrl) {
        imgPreview.src = `http://localhost:8080${currentBookImageUrl}`;
        imgPreview.style.display = "block";
        document.getElementById("bookUploadPlaceholder").style.display = "none";
      }
    } catch (err) {
      console.error("Lỗi tải thông tin sách:", err);
      alert("Lỗi tải thông tin sách!");
    }
  } else {
    // Chế độ thêm mới
    document.getElementById("bookModalTitle").innerText = "Thêm sách mới";
    resetFormInputs();
  }

  renderSelectedCabinetsUI();
  document.getElementById("modalOverlayBook").classList.add("is-open");
}

/**
 * 5. Logic tìm kiếm và chọn nhiều tủ sách
 */
document
  .getElementById("cabinetSearchInput")
  ?.addEventListener("input", (e) => {
    const kw = e.target.value.toLowerCase().trim();
    const popup = document.getElementById("cabinetResultPopup");
    if (!kw || !window.allCabinets) return popup.classList.remove("active");

    // Lọc các tủ chưa được chọn
    const alreadySelected = selectedCabinets.map((c) => c.idCabinet);
    const matched = window.allCabinets.filter(
      (c) =>
        (c.name || c.ten).toLowerCase().includes(kw) &&
        !alreadySelected.includes(c.id),
    );

    popup.innerHTML = matched
      .map(
        (cab) =>
          `<div class="borrow-item" onclick="addCabinetToList(${cab.id}, '${cab.name || cab.ten}')">${cab.name || cab.ten}</div>`,
      )
      .join("");
    popup.classList.add("active");
  });

function addCabinetToList(id, name) {
  if (!selectedCabinets.find((c) => c.idCabinet === id)) {
    selectedCabinets.push({
      inventoryId: null,
      idCabinet: id,
      name: name,
      quantity: 1,
    });
  }
  renderSelectedCabinetsUI();
  document.getElementById("cabinetResultPopup").classList.remove("active");
  document.getElementById("cabinetSearchInput").value = "";
}

function renderSelectedCabinetsUI() {
  const display = document.getElementById("selectedCabinetsDisplay");
  display.innerHTML = selectedCabinets
    .map(
      (c, index) => `
        <div class="selected-book-item" style="border-bottom: 1px solid #eee; padding: 5px 0;">
            <div style="display: flex; justify-content: space-between;">
                <span><b>${c.name}</b></span>
                <span style="color:red; cursor:pointer;" onclick="removeCabinetFromList(${index})">&times;</span>
            </div>
            <div class="cabinet-qty-control">
                <button class="qty-btn" onclick="updateCabinetQtyInList(${index}, -1)">-</button>
                <input type="number" value="${c.quantity}" style="width: 60px; text-align: center;">
                <button class="qty-btn" onclick="updateCabinetQtyInList(${index}, 1)">+</button>
            </div>
        </div>
    `,
    )
    .join("");
}

function updateCabinetQtyInList(index, delta) {
  let q = selectedCabinets[index].quantity + delta;
  selectedCabinets[index].quantity = q < 1 ? 1 : q;
  renderSelectedCabinetsUI();
}

function removeCabinetFromList(index) {
  selectedCabinets.splice(index, 1);
  renderSelectedCabinetsUI();
}

/**
 * 6. Lưu sách (Upload ảnh -> Gửi JSON cho Book + BookInventories)
 */
async function saveBook() {
  const title = document.getElementById("bookName").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const publishYear = parseInt(document.getElementById("bookYear").value) || 0;

  if (!title) return alert("Vui lòng nhập tên sách!");

  if (!editingBookId && selectedCabinets.length === 0) {
    return alert("Vui lòng chọn ít nhất một tủ sách để thêm!");
  }

  try {
    let finalImageUrl = currentBookImageUrl;

    // Upload ảnh nếu có chọn file mới
    if (selectedBookFile) {
      const formData = new FormData();
      formData.append("file", selectedBookFile);
      const uploadRes = await fetch(`${API_URL}/files/upload/books`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      finalImageUrl = uploadData.result;
    }

    if (editingBookId) {
      // TRƯỜNG HỢP UPDATE: Chỉ cập nhật thông tin chung của sách
      const bookPayload = {
        title,
        author,
        publishYear,
        imageUrl: finalImageUrl,
      };

      const updateRes = await fetch(`${API_URL}/books/${editingBookId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(bookPayload),
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
        return alert("Lỗi cập nhật sách: " + err.message);
      }

      // Cập nhật inventories
      for (const cabinet of selectedCabinets) {
        if (cabinet.inventoryId) {
          // Cập nhật inventory hiện có
          const invPayload = { quantity: cabinet.quantity };
          const invUpdateRes = await fetch(
            `${API_URL}/book-inventory/${cabinet.inventoryId}`,
            {
              method: "PUT",
              headers: getHeaders(),
              body: JSON.stringify(invPayload),
            },
          );
          if (!invUpdateRes.ok) {
            console.error("Lỗi cập nhật inventory");
          }
        } else {
          // Tạo inventory mới
          const newInvPayload = {
            bookId: editingBookId,
            cabinetId: cabinet.idCabinet,
            quantity: cabinet.quantity,
          };
          const newInvRes = await fetch(`${API_URL}/book-inventory`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(newInvPayload),
          });
          if (!newInvRes.ok) {
            console.error("Lỗi tạo inventory mới");
          }
        }
      }

      alert("Cập nhật sách thành công!");
    } else {
      // TRƯỜNG HỢP CREATE: Tạo sách mới + bookInventories
      const bookPayload = {
        title,
        author,
        publishYear,
        imageUrl: finalImageUrl,
        assignments: selectedCabinets.map((c) => ({
          idCabinet: c.idCabinet,
          quantity: c.quantity,
        })),
      };

      const createRes = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(bookPayload),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        return alert("Lỗi thêm sách: " + err.message);
      }

      alert("Thêm sách thành công!");
    }

    closeModal("modalOverlayBook");
    renderBooksList();
  } catch (err) {
    console.error("Lỗi hệ thống:", err);
    alert("Lỗi hệ thống!");
  }
}

/**
 * 7. Xóa sách
 */
async function deleteBook(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa sách này?")) return;
  try {
    await fetch(`${API_URL}/books/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    alert("Xóa sách thành công!");
    renderBooksList();
  } catch (err) {
    console.error("Lỗi khi xóa:", err);
    alert("Lỗi khi xóa!");
  }
}

async function quickBorrowInventory(inventoryId, bookId) {
  // if (!localStorage.getItem("token")) {
  //   alert("Vui lòng đăng nhập để mượn sách.");
  //   window.location.href = "Login.html";
  //   return;
  // }

  const book = (window.allBooks || []).find((x) => x.id === bookId);
  const bookTitle = book?.title || "cuốn sách";

  try {
    const rooms = await getAllRooms();
    if (!rooms || rooms.length === 0) {
      alert("Không có phòng đọc nào để chọn. Vui lòng liên hệ quản trị viên.");
      return;
    }

    const roomOptions = rooms
      .map(
        (r) =>
          `${r.id}: ${r.name} (Còn trống: ${r.availableSlots || 0}/${r.capacity || 0})`,
      )
      .join("\n");

    const roomIdInput = prompt(`Chọn phòng bằng cách nhập ID:\n${roomOptions}`);
    const roomId = Number(roomIdInput);

    if (!roomId || !rooms.some((r) => r.id === roomId)) {
      alert("ID phòng không hợp lệ.");
      return;
    }

    const requestData = {
      roomId,
      inventoryIds: [inventoryId],
      note: `Mượn ${bookTitle} từ tủ`,
    };

    const result = await postCheckIn(requestData);

    if (result && result.code === 1000) {
      alert("Mượn sách thành công!");
      renderBooksList();
    } else {
      alert("Lỗi mượn sách: " + (result.message || "Không thể mượn sách"));
    }
  } catch (error) {
    console.error("Lỗi mượn sách nhanh:", error);
    alert("Lỗi kết nối tới server");
  }
}

/**
 * 8. Reset Form Inputs
 */
function resetFormInputs() {
  [
    "bookName",
    "bookAuthor",
    "bookYear",
    "bookGenre",
    "cabinetSearchInput",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("bookImagePreview").style.display = "none";
  document.getElementById("bookUploadPlaceholder").style.display = "block";
  document.getElementById("selectedCabinetsDisplay").innerHTML = "";
  selectedCabinets = [];
}

/**
 * 9. Đóng Modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("is-open");
    resetFormInputs();
  }
}
