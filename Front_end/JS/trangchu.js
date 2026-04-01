let currentActiveBooking = null;

// --- 1. KHỞI TẠO TRANG ---
document.addEventListener("DOMContentLoaded", async () => {
  await initBookingStatus();
  renderLibraryInfo();
  // Đã bỏ renderHomeRooms() ở đây
  renderTopBorrowedBooks();
  renderSelectedBooks();
});

// --- 3. RENDER TRANG CHỦ ---
async function renderLibraryInfo() {
  const container = document.getElementById("libraryInfoContainer");
  if (!container) return;

  try {
    const info = await getLibraryInfo();
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

async function renderFeaturedBooks() {
  const container = document.getElementById("featuredBooks");
  const titleElement = document.getElementById("featuredTitle");
  const kw = document.getElementById("homeSearch").value.toLowerCase().trim();

  if (kw === "") {
    renderTopBorrowedBooks();
    return;
  }

  titleElement.innerText = `Kết quả tìm kiếm cho "${kw}"`;

  try {
    const books = await getAllBooks(kw);
    container.innerHTML = books
      .map((b) => {
        const imgUrl = b.imageUrl
          ? `http://localhost:8080${b.imageUrl}`
          : "/Front_end/img/logo.jpg";
        const rightColHtml = `
            <div class="card-right-inventory">
                <div style="font-weight:bold; font-size:13px; margin-bottom:8px; color:black;">Vị trí tủ:</div>
                <div class="inventory-list-mini">
                    ${(b.inventoryDetails || [])
                      .map(
                        (inv) => `
                        <div class="inv-item-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>${inv.cabinetName}: <b>${inv.availableInCabinet}/${inv.totalInCabinet}</b></span>
                            <button class="btn-borrow-mini" ${inv.availableInCabinet > 0 ? "" : "disabled"} onclick="handleBookAction(${b.id}, '${b.title.replace(/'/g, "\\'")}', ${inv.inventoryId})">${inv.availableInCabinet > 0 ? "Chọn mượn" : "Hết"}</button>
                        </div>`,
                      )
                      .join("")}
                </div>
            </div>`;

        return `
            <div class="card-item">
                <img src="${imgUrl}" class="card-item__img">
                <div class="card-item__info">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h3 style="color:var(--primary-color); margin-top:0;">${b.title}</h3>
                            <p>Tác giả: <strong>${b.author || "N/A"}</strong></p>
                            <p>Năm: ${b.year || b.publishYear || "N/A"}</p>
                            <p>Số lượng: <strong style="color:black">${b.availableQuantity || 0}/${b.totalQuantity || 0}</strong></p>
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
        const availableInvs = (b.inventoryDetails || []).filter(
          (i) => i.availableInCabinet > 0,
        );
        if (!availableInvs.length) return "";
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
                    <select id="select-inv-${b.id}" class="input-field-sm" style="width: 150px; font-size: 12px;">${options}</select>
                    <button class="btn-action-sm" onclick="addBookWithCabinet(${b.id}, '${b.title}')">Chọn</button>
                </div>`;
      })
      .join("");
    popup.classList.add("active");
  } catch (error) {
    console.error("Lỗi Tìm Sách:", error);
  }
}

function addBookWithCabinet(bookId, bookTitle) {
  const select = document.getElementById(`select-inv-${bookId}`);
  const inventoryId = parseInt(select.value);
  const cabinetName = select.options[select.selectedIndex].text
    .split("(")[0]
    .trim();
  handleBookAction(bookId, `${bookTitle} [${cabinetName}]`, inventoryId);
}

async function renderTopBorrowedBooks() {
  const container = document.getElementById("featuredBooks");
  if (!container) return;

  try {
    const books = await getTop10BorrowedBooks();
    if (!books || !books.length) {
      container.innerHTML = "<p>Hôm nay chưa có dữ liệu mượn sách.</p>";
      return;
    }

    container.innerHTML = books
      .map((b) => {
        const imgUrl = b.imageUrl
          ? `http://localhost:8080${b.imageUrl}`
          : "/Front_end/img/logo.jpg";
        const rightColHtml = `
            <div class="card-right-inventory">
                <div style="font-weight:bold; font-size:13px; margin-bottom:8px; color:black;">Vị trí tủ:</div>
                <div class="inventory-list-mini">
                    ${(b.inventoryDetails || [])
                      .map(
                        (inv) => `
                        <div class="inv-item-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>${inv.cabinetName}: <b>${inv.availableInCabinet}/${inv.totalInCabinet}</b></span>
                            <button class="btn-borrow-mini" ${inv.availableInCabinet > 0 ? "" : "disabled"} 
                              onclick="handleBookAction(${b.id}, '${b.title}', ${inv.inventoryId}, '${inv.cabinetName}')">
                              ${inv.availableInCabinet > 0 ? "Chọn mượn" : "Hết"}
                            </button>
                        </div>`,
                      )
                      .join("")}
                </div>
            </div>`;
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
                            <p>Số lượng: <strong style="color:black">${b.availableQuantity || 0}/${b.totalQuantity || 0}</strong></p>
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

document.addEventListener("click", (e) => {
  if (!e.target.closest(".borrow-search-wrapper")) {
    document
      .getElementById("modalBookSearchResult")
      ?.classList.remove("active");
  }
});
