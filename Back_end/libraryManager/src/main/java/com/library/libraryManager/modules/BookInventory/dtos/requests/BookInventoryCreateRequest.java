package com.library.libraryManager.modules.BookInventory.dtos.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BookInventoryCreateRequest(
    @NotNull(message = "Book ID không được để trống")
    Long bookId,

    @NotNull(message = "Cabinet ID không được để trống")
    Long cabinetId,

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải ít nhất là 1")
    int quantity
) {}
