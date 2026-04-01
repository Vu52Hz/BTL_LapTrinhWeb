package com.library.libraryManager.modules.book.dtos.requests;

import jakarta.validation.constraints.*;

public record BookUpdateRequest(
    @NotBlank(message = "Tên sách không được để trống")
    String title,
    
    String author,
    
    Integer publishYear,
    
    String imageUrl
) {}