// Biến lưu trữ trạng thái
let editingRoomId = null;
let selectedFile = null; // Lưu file người dùng vừa chọn (chưa upload)
let currentRoomImageUrl = ""; // Lưu URL ảnh cũ (dùng khi Sửa hoặc sau khi Upload thành công)

/**
 * 1. Hiển thị danh sách phòng từ API
 */
async function renderRooms() {
  const container = document.getElementById("roomListContainer");
  const kw = document
    .getElementById("roomSearchInput")
    .value.trim()
    .toLowerCase();

  try {
    let rooms = await getAllRooms(kw); // Hàm này từ data.js

    // if (kw) {
    //   rooms = rooms.filter((r) => r.name.toLowerCase().includes(kw));
    // }

    if (!rooms || rooms.length === 0) {
      container.innerHTML = `<p style="padding: 20px;">Không tìm thấy phòng nào.</p>`;
      return;
    }

    // Tính số sách trong mỗi phòng (tủ -> phòng), nếu cần thì gọi API inventory
    const roomBookCount = {};
    await Promise.all(
      rooms.map(async (room) => {
        try {
          const res = await fetch(
            `${API_URL}/book-inventory/cabinet/${room.id}`,
            {
              headers: getHeaders(),
            },
          );
          const data = await res.json();
          const total = (data.result || []).reduce(
            (sum, inv) => sum + (inv.quantity || 0),
            0,
          );
          roomBookCount[room.id] = total;
        } catch (err) {
          console.warn("Không tải được số sách cho phòng", room.id, err);
          roomBookCount[room.id] = 0;
        }
      }),
    );

    container.innerHTML = rooms
      .map((r) => {
        const imgUrl = r.imageUrl
          ? `http://localhost:8080${r.imageUrl}`
          : "/Front_end/img/logo.jpg";
        const bookCount = roomBookCount[r.id] || 0;
        return `
            <div class="card-item">
                <img src="${imgUrl}" class="card-item__img">
                <div class="card-item__info">
                    <h3>${r.name}</h3>
                    <p>Còn Trống: <strong>${r.availableSlots || 0}/${r.capacity || 0}</strong></p>
                    <p>Số sách trong phòng: <strong>${bookCount}</strong></p>
                    <p>Ghi chú: ${r.note || "Không có"}</p>
                    <div class="actions">
                        <button class="btn-action admin-only" onclick="openEditRoom(${r.id})">Sửa Thông Tin</button>
                        <button class="btn-action-delete admin-only" onclick="deleteRoom(${r.id})">Xóa Phòng</button>
                    </div>
                </div>
            </div>`;
      })
      .join("");

    // Cập nhật hiển thị nút Admin (hàm từ common.js)
    applyAdminRestrictions();
  } catch (err) {
    console.error("Lỗi renderRooms:", err);
  }
}

/**
 * 2. Xử lý xem trước ảnh (Chưa upload)
 */
function previewAndUploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Lưu file vào biến tạm, chưa gọi API fetch ở đây
  selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById("roomImagePreview");
    img.src = e.target.result;
    img.style.display = "block";
    document.getElementById("uploadPlaceholder").style.display = "none";
  };
  reader.readAsDataURL(file);
}

/**
 * 3. Lưu phòng (Chỉ upload ảnh khi nhấn nút này)
 */
async function saveRoom() {
  const name = document.getElementById("roomNameInput").value.trim();
  const capacity = parseInt(document.getElementById("roomQty").value);
  const note = document.getElementById("roomNoteInput").value.trim();

  if (!name) return alert("Vui lòng nhập tên phòng!");

  try {
    let finalImageUrl = currentRoomImageUrl; // Mặc định giữ URL cũ

    // BƯỚC 1: Nếu có chọn file mới thì mới upload lên server
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Upload vào thư mục 'rooms' qua PathVariable ở Backend
      const uploadRes = await fetch(`${API_URL}/files/upload/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload ảnh thất bại");

      const uploadData = await uploadRes.json();
      finalImageUrl = uploadData.result; // URL nhận được: /uploads/rooms/uuid_name.jpg
    }

    // BƯỚC 2: Gửi payload lưu thông tin phòng
    const payload = {
      name,
      capacity,
      note,
      imageUrl: finalImageUrl, // Lưu URL đầy đủ vào DB để dễ sử dụng ở FE
    };

    const method = editingRoomId ? "PUT" : "POST";
    const url = editingRoomId
      ? `${API_URL}/rooms/${editingRoomId}`
      : `${API_URL}/rooms`;

    const response = await fetch(url, {
      method: method,
      headers: getHeaders(), // Hàm từ common.js
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert(editingRoomId ? "Cập nhật thành công!" : "Thêm phòng thành công!");
      closeModal("modalOverlayRooms");
      renderRooms();
      // Reset các biến tạm sau khi lưu
      selectedFile = null;
      currentRoomImageUrl = "";
    } else {
      const result = await response.json();
      alert("Lỗi lưu phòng: " + result.message);
    }
  } catch (err) {
    console.error("Lỗi saveRoom:", err);
    alert("Không thể kết nối tới server hoặc lỗi upload!");
  }
}

/**
 * 4. Xóa phòng
 */
async function deleteRoom(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;

  try {
    const response = await fetch(`${API_URL}/rooms/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (response.ok) {
      alert("Xóa thành công!");
      renderRooms();
    } else {
      const err = await response.json();
      alert("Lỗi: " + (err.message || "Không thể xóa phòng."));
    }
  } catch (err) {
    alert("Lỗi kết nối server!");
  }
}

/**
 * 5. Mở modal Sửa
 */
async function openEditRoom(id) {
  try {
    const res = await fetch(`${API_URL}/rooms/${id}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    const room = data.result;

    editingRoomId = id;
    selectedFile = null; // Reset file vừa chọn trước đó
    currentRoomImageUrl = room.imageUrl || "";

    // Hiển thị tiêu đề và dữ liệu
    document.getElementById("roomModalTitle").innerText = "SỬA PHÒNG ĐỌC";
    document.getElementById("roomNameInput").value = room.name;
    document.getElementById("roomQty").value = room.capacity || 1;
    document.getElementById("roomNoteInput").value = room.note || "";

    // Hiển thị ảnh cũ nếu có
    const imgPreview = document.getElementById("roomImagePreview");
    if (currentRoomImageUrl) {
      imgPreview.src = currentRoomImageUrl.startsWith("http")
        ? currentRoomImageUrl
        : `http://localhost:8080${currentRoomImageUrl}`;
      imgPreview.style.display = "block";
      document.getElementById("uploadPlaceholder").style.display = "none";
    } else {
      imgPreview.style.display = "none";
      document.getElementById("uploadPlaceholder").style.display = "block";
    }

    document.getElementById("modalOverlayRooms").classList.add("is-open");
  } catch (err) {
    alert("Không lấy được thông tin phòng!");
  }
}

/**
 * 6. Mở modal Thêm mới
 */
function openAddRoom() {
  editingRoomId = null;
  selectedFile = null;
  currentRoomImageUrl = "";

  document.getElementById("roomModalTitle").innerText = "THÊM PHÒNG ĐỌC MỚI";
  document.getElementById("roomNameInput").value = "";
  document.getElementById("roomQty").value = 1;
  document.getElementById("roomNoteInput").value = "";

  // Reset giao diện ảnh
  const imgPreview = document.getElementById("roomImagePreview");
  imgPreview.src = "";
  imgPreview.style.display = "none";
  document.getElementById("uploadPlaceholder").style.display = "block";
  document.getElementById("roomImageInput").value = "";

  document.getElementById("modalOverlayRooms").classList.add("is-open");
}

/**
 * Khởi tạo trang
 */
document.addEventListener("DOMContentLoaded", () => {
  const btnSave = document.getElementById("btnConfirmAddRoom");
  if (btnSave) btnSave.onclick = saveRoom;
  renderRooms();
});
