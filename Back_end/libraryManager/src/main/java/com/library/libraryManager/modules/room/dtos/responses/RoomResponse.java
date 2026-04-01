package com.library.libraryManager.modules.room.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private String name;
    private String note;
    private String imageUrl;     // URL ảnh đại diện của phòng
    private Integer capacity;      // Tổng sức chứa (ví dụ: 40)
    private Integer availableSlots; // Số chỗ thực tế còn trống (ví dụ: 35)
    private Integer totalUsers;     // Số người đang ngồi (ví dụ: 5)
}