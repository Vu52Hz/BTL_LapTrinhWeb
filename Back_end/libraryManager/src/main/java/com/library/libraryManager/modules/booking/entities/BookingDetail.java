package com.library.libraryManager.modules.booking.entities;

import com.library.libraryManager.common.constants.BookBorrowStatus;
import com.library.libraryManager.modules.book.entities.Book;
import com.library.libraryManager.modules.BookInventory.entities.BookInventory; // Thêm import này
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_details")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private Book book;

    // THÊM: Lưu vết mượn từ tủ (Inventory) nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id")
    private BookInventory inventory;

    @Enumerated(EnumType.STRING)
    private BookBorrowStatus status; 

    private LocalDateTime returnTime; 
}