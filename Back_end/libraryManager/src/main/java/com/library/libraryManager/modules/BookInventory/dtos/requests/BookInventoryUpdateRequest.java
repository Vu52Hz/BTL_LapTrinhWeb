package com.library.libraryManager.modules.BookInventory.dtos.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BookInventoryUpdateRequest(
    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 0, message = "Số lượng không được âm")
    int quantity
) {}
