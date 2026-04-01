package com.library.libraryManager.modules.room.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder // Thêm Builder để đồng nhất với cách bạn viết ở UserService
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "note", columnDefinition = "TEXT") // Định nghĩa rõ kiểu dữ liệu nếu cần
    private String note; // Ghi chú thêm về phòng (ví dụ: "Phòng yên tĩnh", "Có máy lạnh", v.v.)

    @Column(name = "image_url")
    private String imageUrl;

    private int capacity;//dung tích phòng
    private int availableSlots; // Số chỗ còn trống

    // Thêm 2 dòng này vào dưới cùng của class Room
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

}