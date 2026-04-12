// 1. Cấu hình hằng số
const BOOKING_API = "http://localhost:8080/api/v1/bookings";

// 2. Hàm Render chính
async function renderHistory() {
  const token = localStorage.getItem("token");
  const rolesRaw = localStorage.getItem("roles");

  if (!token) {
    alert("Vui lòng đăng nhập!");
    window.location.href = "Login.html";
    return;
  }

  const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
  const isUserAdmin = roles.some((r) => r.authority === "ROLE_ADMIN");

  const endpoint = isUserAdmin
    ? `${BOOKING_API}/all-history`
    : `${BOOKING_API}/my-history`;

  try {
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

    let data = result.result || [];

    // --- BỘ LỌC FRONT-END ---
    const kw =
      document.getElementById("historySearch")?.value.toLowerCase() || "";
    const rFilter = document.getElementById("filterRoom")?.value || "";
    const dateFrom = document.getElementById("dateFrom")?.value || "";
    const dateTo = document.getElementById("dateTo")?.value || "";
    const showReading = document.getElementById("statusReading")?.checked;
    const showFinished = document.getElementById("statusFinished")?.checked;

    // Lọc theo từ khóa
    if (kw) {
      data = data.filter(
        (h) => h.userName && h.userName.toLowerCase().includes(kw),
      );
    }

    // Lọc theo tên phòng
    if (rFilter) {
      data = data.filter((h) => h.roomName && h.roomName.includes(rFilter));
    }

    // Lọc theo trạng thái Checkbox
    data = data.filter((h) => {
      const isReading = h.status === "IN_USE";
      if (showReading && isReading) return true;
      if (showFinished && h.status === "COMPLETED") return true;
      return false;
    });

    // Lọc theo ngày (TÍNH THEO THỜI GIAN TRẢ - endTime)
    if (dateFrom || dateTo) {
      data = data.filter((h) => {
        const targetDateStr = h.endTime ? h.endTime : h.startTime;
        if (!targetDateStr) return false;

        const checkDate = new Date(targetDateStr).setHours(0, 0, 0, 0);

        if (dateFrom && checkDate < new Date(dateFrom).setHours(0, 0, 0, 0))
          return false;
        if (dateTo && checkDate > new Date(dateTo).setHours(0, 0, 0, 0))
          return false;
        return true;
      });
    }

    // --- TÍNH TOÁN SỐ LƯỢT ĐỌC & TÌM TOP 5 ---
    const userReadCounts = {};
    data.forEach((h) => {
      const uName = h.userName || "N/A";
      userReadCounts[uName] = (userReadCounts[uName] || 0) + 1;
    });

    const totalSessions = data.length;
    const uniqueUsers = Object.keys(userReadCounts).length;

    // Chuyển object thành mảng, loại bỏ "N/A" (nếu muốn), sắp xếp giảm dần và lấy 5 người đầu tiên
    const top5Users = Object.entries(userReadCounts)
      .filter(([name]) => name !== "N/A")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Tạo HTML cho danh sách Top 5 (Dạng các thẻ badge nhìn cho chuyên nghiệp)
    let top5Html = "";
    if (top5Users.length > 0) {
      const badges = top5Users
        .map(
          (u, index) => `
        <div style="display: inline-block; background: #fff; border: 1px solid #90caf9; padding: 5px 12px; border-radius: 20px; font-size: 14px; margin-right: 10px; margin-bottom: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <span style="color: #e65100; font-weight: bold; margin-right: 4px;">#${index + 1}</span> 
          <b>${u[0]}</b> 
          <span style="color: #666; font-size: 12px; margin-left: 4px;">(${u[1]} lượt)</span>
        </div>
      `,
        )
        .join("");

      top5Html = `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #90caf9;">
          <div style="margin-bottom: 8px; color: #1565c0; font-weight: bold;">🏆 Top 5 bạn đọc mượn nhiều nhất:</div>
          ${badges}
        </div>
      `;
    }

    // --- HIỂN THỊ THỐNG KÊ ---
    const statsDiv = document.getElementById("statisticsSummary");
    if (statsDiv) {
      statsDiv.innerHTML = `
        <div><b>Báo cáo tổng quan:</b> Tìm thấy <b>${totalSessions}</b> lượt đọc sách từ <b>${uniqueUsers}</b> người dùng khác nhau.</div>
        ${top5Html}
      `;
    }

    // --- SẮP XẾP DỮ LIỆU BẢNG ---
    const sortBy = document.getElementById("sortBy")?.value || "time_desc";
    data.sort((a, b) => {
      const timeA = a.endTime
        ? new Date(a.endTime).getTime()
        : new Date(a.startTime).getTime();
      const timeB = b.endTime
        ? new Date(b.endTime).getTime()
        : new Date(b.startTime).getTime();

      const countA = userReadCounts[a.userName || "N/A"] || 0;
      const countB = userReadCounts[b.userName || "N/A"] || 0;

      switch (sortBy) {
        case "time_desc":
          return timeB - timeA;
        case "time_asc":
          return timeA - timeB;
        case "count_desc":
          return countB - countA;
        case "count_asc":
          return countA - countB;
        default:
          return 0;
      }
    });

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
        const uName = h.userName || "N/A";
        const readCount = userReadCounts[uName] || 0;

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
              <td><b>${uName}</b></td>
              <td><span class="badge-room">${h.roomName || "N/A"}</span></td>
              <td>${formatDateTime(h.startTime)}</td>
              <td style="color: ${h.status === "IN_USE" ? "green" : "black"}">
                  ${h.endTime ? formatDateTime(h.endTime) : "<b>Đang ở trong phòng</b>"}
              </td>
              <td style="text-align:left;">${booksHtml}</td>
              <td style="text-align: center; font-weight: bold; color: #d32f2f;">
                  ${readCount}
              </td>
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
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
  }
}

// 4. Xử lý Trả phòng
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

// 5. Xử lý Trả lẻ từng cuốn
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

// 7. Khởi tạo
document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
});
