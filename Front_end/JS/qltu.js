let editingCabId = null;
let selectedCabFile = null;
let currentCabImageUrl = "";

// 1. Render danh sách tủ sách từ Backend
async function renderCabinets() {
  const container = document.getElementById("cabinetListContainer");
  const keyword = document
    .getElementById("cabSearchInput")
    .value.trim()
    .toLowerCase();

  try {
    // Gọi API lấy danh sách tủ (Hàm này nên có trong data.js hoặc gọi fetch trực tiếp)
    const response = await fetch(`${API_URL}/cabinets`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    let cabinets = data.result || [];

    if (keyword) {
      cabinets = cabinets.filter((c) => c.ten.toLowerCase().includes(keyword));
    }

    if (cabinets.length === 0) {
      container.innerHTML = `<p style="padding: 20px;">Không tìm thấy tủ sách nào.</p>`;
      return;
    }

    container.innerHTML = cabinets
      .map((cab) => {
        // Lưu ý: imageUrl là tên trường trả về từ Backend DTO của bạn
        const imgUrl = cab.urlAnhTuSach
          ? `http://localhost:8080${cab.urlAnhTuSach}`
          : "/Front_end/img/logo.jpg";

        return `
                <div class="card-item">
                    <img src="${imgUrl}" class="card-item__img">
                    <div class="card-item__info">
                        <h3>${cab.ten}</h3>
                        <p>Số đầu sách: <strong>${cab.tongSoSach || 0}</strong> loại</p>
                        <p>Ghi chú: ${cab.note || "Không có ghi chú"}</p>
                        <div class="actions">
                            <button class="btn-action admin-only" onclick="openCabinetModal(${cab.id})">Sửa</button>
                            <button class="btn-action-delete admin-only" onclick="deleteCab(${cab.id})">Xóa Tủ</button>
                        </div>
                    </div>
                </div>`;
      })
      .join("");

    applyAdminRestrictions(); // Ẩn/hiện nút admin
  } catch (err) {
    console.error("Lỗi tải danh sách tủ:", err);
  }
}

// 2. Xử lý xem trước ảnh
function previewCabinetImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  selectedCabFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById("cabImagePreview");
    img.src = e.target.result;
    img.style.display = "block";
    document.getElementById("cabUploadPlaceholder").style.display = "none";
  };
  reader.readAsDataURL(file);
}

// 3. Mở Modal (Thêm/Sửa)
async function openCabinetModal(id = null) {
  editingCabId = id;
  selectedCabFile = null;

  if (id) {
    try {
      const res = await fetch(`${API_URL}/cabinets/${id}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      const cab = data.result;

      document.getElementById("cabModalTitle").innerText = "CẬP NHẬT TỦ SÁCH";
      document.getElementById("cabNameInput").value = cab.ten;
      document.getElementById("cabNoteInput").value = cab.note || "";
      currentCabImageUrl = cab.urlAnhTuSach || "";

      const imgPreview = document.getElementById("cabImagePreview");
      if (currentCabImageUrl) {
        imgPreview.src = `http://localhost:8080${currentCabImageUrl}`;
        imgPreview.style.display = "block";
        document.getElementById("cabUploadPlaceholder").style.display = "none";
      } else {
        imgPreview.style.display = "none";
        document.getElementById("cabUploadPlaceholder").style.display = "block";
      }
    } catch (err) {
      alert("Lỗi lấy thông tin tủ!");
    }
  } else {
    document.getElementById("cabModalTitle").innerText = "THÊM TỦ MỚI";
    document.getElementById("cabNameInput").value = "";
    document.getElementById("cabNoteInput").value = "";
    document.getElementById("cabImagePreview").style.display = "none";
    document.getElementById("cabUploadPlaceholder").style.display = "block";
    currentCabImageUrl = "";
  }

  document.getElementById("modalOverlayCabinets").classList.add("is-open");
}

function closeCabinetModal() {
  document.getElementById("modalOverlayCabinets").classList.remove("is-open");
}

// 4. Lưu dữ liệu (Upload ảnh trước -> Lưu tủ sau)
async function saveCabinet() {
  const name = document.getElementById("cabNameInput").value.trim();
  const note = document.getElementById("cabNoteInput").value.trim();

  if (!name) return alert("Vui lòng nhập tên tủ sách!");

  try {
    let finalUrl = currentCabImageUrl;

    // Nếu có chọn file mới, upload lên folder 'cabinets' (hoặc 'books' tùy bạn config BE)
    if (selectedCabFile) {
      const formData = new FormData();
      formData.append("file", selectedCabFile);
      const uploadRes = await fetch(`${API_URL}/files/upload/cabinets`, {
        // Dùng chung folder rooms hoặc tạo folder mới
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      finalUrl = uploadData.result;
    }

    const payload = { ten: name, note, urlAnhTuSach: finalUrl };
    const method = editingCabId ? "PUT" : "POST";
    const url = editingCabId
      ? `${API_URL}/cabinets/${editingCabId}`
      : `${API_URL}/cabinets`;

    const response = await fetch(url, {
      method: method,
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert("Thành công!");
      closeCabinetModal();
      renderCabinets();
    } else {
      const err = await response.json();
      alert("Lỗi: " + err.message);
    }
  } catch (err) {
    alert("Lỗi kết nối!");
  }
}

// 5. Xóa tủ
async function deleteCab(id) {
  if (
    !confirm(
      "Bạn có chắc chắn muốn xóa tủ này? Mọi sách bên trong sẽ mất liên kết!",
    )
  )
    return;

  try {
    const response = await fetch(`${API_URL}/cabinets/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (response.ok) {
      alert("Đã xóa tủ thành công.");
      renderCabinets();
    } else {
      alert("Không thể xóa tủ đang chứa sách!");
    }
  } catch (err) {
    alert("Lỗi kết nối!");
  }
}

// Khởi chạy khi load trang
document.addEventListener("DOMContentLoaded", renderCabinets);
