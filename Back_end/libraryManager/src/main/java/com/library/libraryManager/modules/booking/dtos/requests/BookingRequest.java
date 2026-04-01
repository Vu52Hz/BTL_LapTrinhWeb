package com.library.libraryManager.modules.booking.dtos.requests;

import java.util.List;

public record BookingRequest(
    Long userId,
    Long roomId,
    List<Long> inventoryIds, // Đổi từ bookIds thành inventoryIds
    String note
) {}