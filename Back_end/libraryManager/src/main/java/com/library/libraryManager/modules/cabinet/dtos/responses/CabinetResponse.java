package com.library.libraryManager.modules.cabinet.dtos.responses;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CabinetResponse {
    private Long id;
    private String ten;
    private String note;
    private String urlAnhTuSach;
    private Integer tongSoSach;       // Tổng số cuốn vật lý (cộng dồn totalQuantity)
    private Integer uniqueBooksCount; // Số lượng đầu sách khác nhau trong tủ
}