package com.library.libraryManager.modules.cabinet.entities;

import com.library.libraryManager.modules.BookInventory.entities.BookInventory; // Kiểm tra lại package này của bạn
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "tu_sach")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cabinet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ten;
    private String note;
    private String urlAnhTuSach;

    // THÊM ĐOẠN NÀY: Để Hibernate hiểu "c.books" là gì trong Repository
    @OneToMany(mappedBy = "cabinet", fetch = FetchType.LAZY)
    private List<BookInventory> books; 
}