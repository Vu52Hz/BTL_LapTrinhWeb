package com.library.libraryManager.modules.cabinet.dtos.requests;

import jakarta.validation.constraints.NotBlank;

public record CabinetRequest(
    @NotBlank(message = "Tên tủ không được để trống")
    String ten,
    String note,
    String urlAnhTuSach
) {}