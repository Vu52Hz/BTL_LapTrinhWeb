package com.library.libraryManager.modules.BookInventory.entities;

import com.library.libraryManager.modules.book.entities.Book;
import com.library.libraryManager.modules.cabinet.entities.Cabinet;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookInventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cabinet_id", nullable = false)
    private Cabinet cabinet;

    /**
     * Tổng số lượng sách vật lý được nhập vào tủ này.
     * Giá trị này thường cố định, chỉ thay đổi khi nhập thêm sách hoặc thanh lý.
     */
    @Column(name = "total_quantity", nullable = false)
    private int totalQuantity;

    /**
     * Số lượng sách hiện còn trên kệ để có thể cho mượn.
     * Logic: availableQuantity = totalQuantity - (số lượng đang được mượn).
     */
    @Column(name = "available_quantity", nullable = false)
    private int availableQuantity;

    // Helper method để khởi tạo khi tạo mới inventory
    @PrePersist
    public void prePersist() {
        // Khi mới thêm sách vào tủ, số lượng sẵn có mặc định bằng tổng số lượng
        if (this.availableQuantity == 0 && this.totalQuantity > 0) {
            this.availableQuantity = this.totalQuantity;
        }
    }

    @Column(nullable = false)
    private boolean isActive = true;
}