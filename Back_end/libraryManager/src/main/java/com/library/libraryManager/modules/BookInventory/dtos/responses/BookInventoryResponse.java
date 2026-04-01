package com.library.libraryManager.modules.BookInventory.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookInventoryResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private Long cabinetId;
    private String cabinetName;
    private Integer totalInCabinet;
    private Integer availableInCabinet;
}
