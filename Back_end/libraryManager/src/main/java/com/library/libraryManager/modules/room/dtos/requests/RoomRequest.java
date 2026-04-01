package com.library.libraryManager.modules.room.dtos.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record RoomRequest(
    @NotBlank(message = "Tên phòng không được để trống")
    String name,

    String note,
    String imageUrl,

    @Min(value = 1, message = "Sức chứa phải ít nhất là 1")
    int capacity
) {}