package com.library.libraryManager.modules.book.dtos.responses;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class BookResponse {
    private Long id;
    private String title;
    private String author;
    private Integer year;
    private String imageUrl;
    
    // Tổng cộng của tất cả các tủ
    private Integer totalQuantity;     
    private Integer availableQuantity; 

    // Chi tiết từng tủ
    private List<InventoryDetailResponse> inventoryDetails;

    @Data
    @Builder
    public static class InventoryDetailResponse {
        private Long inventoryId;
        private Long cabinetId;
        private String cabinetName;
        private Integer totalInCabinet;
        private Integer availableInCabinet;
    }
}