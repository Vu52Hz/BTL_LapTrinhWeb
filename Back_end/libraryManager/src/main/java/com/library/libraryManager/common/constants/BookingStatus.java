package com.library.libraryManager.common.constants;

public enum BookingStatus {
    PENDING_CONFIRM, // Đang chờ xác nhận (chưa được admin duyệt)
    IN_USE,    // Đang ngồi trong phòng
    COMPLETED, // Đã trả phòng và trả sách
    CANCELLED  // Đã hủy lượt mượn
}