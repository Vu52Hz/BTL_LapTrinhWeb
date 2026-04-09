// 1. Cấu hình hằng số (Dùng API_URL từ file data.js nếu đã import, hoặc định nghĩa tại đây)
const BOOKING_API = "http://localhost:8080/api/v1/bookings";

// 2. Hàm Render chính
async function renderHistory() {
  // SỬA LỖI: Lấy token và roles trực tiếp từ localStorage giống như common.js và auth.js
  const token = localStorage.getItem("token");
  const rolesRaw = localStorage.getItem("roles");

  if (!token) {
    alert("Vui lòng đăng nhập!");
    window.location.href = "Login.html";
    return;
  }

  const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
  const isUserAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");

  // Xác định endpoint dựa trên quyền
  const endpoint = isUserAdmin
    ? `${BOOKING_API}/all-history`
    : `${BOOKING_API}/my-history`;

  try {
    // Sử dụng getHeaders() từ file data.js (đảm bảo file data.js được load trước file này)
    const response = await fetch(endpoint, {
      headers:
        typeof getHeaders === "function"
          ? getHeaders()
          : {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
    });

    const result = await response.json();

    if (!response.ok)
      throw new Error(result.message || "Không thể lấy dữ liệu");

    let data = result.result || []; // Mảng BookingResponse

    // --- BỘ LỌC FRONT-END ---
    const kw =
      document.getElementById("historySearch")?.value.toLowerCase() || "";
    const rFilter = document.getElementById("filterRoom")?.value || "";
    const dateFrom = document.getElementById("dateFrom")?.value || "";
    const dateTo = document.getElementById("dateTo")?.value || "";
    const showReading = document.getElementById("statusReading")?.checked;
    const showFinished = document.getElementById("statusFinished")?.checked;

    // Lọc theo từ khóa (Tên người dùng hoặc tên phòng)
    if (kw) {
      data = data.filter(
        (h) => h.userName && h.userName.toLowerCase().includes(kw),
      );
    }

    // Lọc theo tên phòng
    if (rFilter) {
      data = data.filter((h) => h.roomName && h.roomName.includes(rFilter));
    }

    // Lọc theo trạng thái Checkbox (IN_USE / COMPLETED)
    data = data.filter((h) => {
      const isReading = h.status === "IN_USE";
      if (showReading && isReading) return true;
      if (showFinished && h.status === "COMPLETED") return true;
      return false;
    });

    // Lọc theo ngày (StartTime)
    if (dateFrom || dateTo) {
      data = data.filter((h) => {
        const checkDate = new Date(h.startTime).setHours(0, 0, 0, 0);
        if (dateFrom && checkDate < new Date(dateFrom).setHours(0, 0, 0, 0))
          return false;
        if (dateTo && checkDate > new Date(dateTo).setHours(0, 0, 0, 0))
          return false;
        return true;
      });
    }

    // --- CẬP NHẬT FILTER PHÒNG ---
    const roomFilter = document.getElementById("filterRoom");
    if (roomFilter) {
      const currentRoom = roomFilter.value;
      const originalData = result.result || [];
      const roomNames = [
        ...new Set(originalData.map((h) => h.roomName || "")),
      ].filter(Boolean);
      roomFilter.innerHTML =
        `<option value="">-- Tất cả phòng --</option>` +
        roomNames
          .map(
            (r) =>
              `<option value="${r}" ${r === currentRoom ? "selected" : ""}>${r}</option>`,
          )
          .join("");
    }

    // --- HIỂN THỊ DỮ LIỆU ---
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    tbody.innerHTML = data
      .map((h) => {
        // Xử lý hiển thị danh sách sách mượn kèm trạng thái từng cuốn
        const booksHtml = (h.borrowedBooks || [])
          .map(
            (b) =>
              `<div style="margin-bottom: 4px;">
                                • ${b.title} 
                                <span style="color: ${b.status === "READING" ? "#e67e22" : "#27ae60"}; font-size: 11px;">
                                    (${b.status === "READING" ? "Đang đọc" : "Đã trả"})
                                </span>
                                ${
                                  isUserAdmin &&
                                  b.status === "READING" &&
                                  h.status === "IN_USE"
                                    ? `<a href="javascript:void(0)" onclick="handleReturnPartial(${h.id}, ${b.bookId})" style="margin-left:5px; color:blue; text-decoration:underline;">[Trả lẻ]</a>`
                                    : ""
                                }
                            </div>`,
          )
          .join("");

        return `
                        <tr>
                            <td><b>${h.userName || "N/A"}</b></td>
                            <td><span class="badge-room">${h.roomName || "N/A"}</span></td>
                            <td>${formatDateTime(h.startTime)}</td>
                            <td style="color: ${h.status === "IN_USE" ? "green" : "black"}">
                                ${h.endTime ? formatDateTime(h.endTime) : "<b>Đang ở trong phòng</b>"}
                            </td>
                            <td style="text-align:left;">${booksHtml}</td>
                            <td>
                                ${
                                  h.status === "IN_USE" && isUserAdmin
                                    ? `<button class="btn-tra-phong" onclick="handleCheckOut(${h.id})">Trả tất cả</button>`
                                    : `<span style="color:gray; font-style: italic">Không có thao tác</span>`
                                }
                            </td>
                        </tr>
                    `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi:", error);
    const tbody = document.getElementById("historyTableBody");
    if (tbody)
      tbody.innerHTML = `<tr><td colspan="7">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
  }
}

// 4. Xử lý Trả phòng (Check-out tất cả)
async function handleCheckOut(bookingId) {
  if (!confirm("Xác nhận người dùng đã trả tất cả sách và rời phòng?")) return;

  try {
    const response = await fetch(`${BOOKING_API}/${bookingId}/checkout`, {
      method: "PUT",
      headers:
        typeof getHeaders === "function"
          ? getHeaders()
          : {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
    });
    const result = await response.json();

    if (response.ok) {
      alert("Đã hoàn tất thủ tục trả phòng!");
      renderHistory();
    } else {
      alert("Lỗi: " + (result.message || "Không thể trả phòng"));
    }
  } catch (error) {
    alert("Lỗi kết nối server");
  }
}

// 5. Xử lý Trả lẻ từng cuốn (Partial Return)
async function handleReturnPartial(bookingId, bookId) {
  if (!confirm("Xác nhận trả riêng cuốn sách này?")) return;

  try {
    const response = await fetch(
      `${BOOKING_API}/${bookingId}/return-book/${bookId}`,
      {
        method: "PUT",
        headers:
          typeof getHeaders === "function"
            ? getHeaders()
            : {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
      },
    );
    const result = await response.json();

    if (response.ok) {
      renderHistory();
    } else {
      alert("Lỗi: " + (result.message || "Không thể trả sách"));
    }
  } catch (error) {
    alert("Lỗi kết nối server");
  }
}

// 6. Hàm định dạng thời gian
function formatDateTime(isoString) {
  if (!isoString) return "---";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "---";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// 7. Khởi tạo khi load trang
document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
});
