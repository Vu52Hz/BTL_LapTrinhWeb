package com.library.libraryManager.modules.book.dtos.requests;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record BookCreateRequest(
    @NotBlank(message = "Tên sách không được để trống")
    String title,
    
    String author,
    
    Integer publishYear,
    
    String imageUrl,

    @NotEmpty(message = "Phải chọn ít nhất một tủ sách")
    @Valid 
    List<CabinetAssignment> assignments
) {
    public record CabinetAssignment(
        @NotNull(message = "ID tủ không được để trống")
        Long idCabinet,
        
        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Số lượng tại mỗi tủ phải ít nhất là 1")
        int quantity
    ) {}
}