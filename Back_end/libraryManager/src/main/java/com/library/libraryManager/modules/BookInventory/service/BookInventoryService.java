package com.library.libraryManager.modules.BookInventory.service;

import com.library.libraryManager.common.exception.AppException;
import com.library.libraryManager.common.exception.ErrorCode;
import com.library.libraryManager.modules.BookInventory.dtos.requests.BookInventoryCreateRequest;
import com.library.libraryManager.modules.BookInventory.dtos.requests.BookInventoryUpdateRequest;
import com.library.libraryManager.modules.BookInventory.dtos.responses.BookInventoryResponse;
import com.library.libraryManager.modules.BookInventory.entities.BookInventory;
import com.library.libraryManager.modules.BookInventory.repositories.BookInventoryRepository;
import com.library.libraryManager.modules.book.entities.Book;
import com.library.libraryManager.modules.book.repositories.BookRepository;
import com.library.libraryManager.modules.cabinet.entities.Cabinet;
import com.library.libraryManager.modules.cabinet.repositories.CabinetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor

public class BookInventoryService {
    private final BookInventoryRepository bookInventoryRepository;
    private final BookRepository bookRepository;
    private final CabinetRepository cabinetRepository;

    @Transactional
    public BookInventoryResponse createInventory(BookInventoryCreateRequest request) {
        // Logic gộp: Nếu đã tồn tại thì update, chưa thì tạo mới
        assignBookToCabinet(request.bookId(), request.cabinetId(), request.quantity());
        
        BookInventory saved = bookInventoryRepository.findByBookIdAndCabinetId(request.bookId(), request.cabinetId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));
        
        return mapToResponse(saved);
    }

    // Logic cập nhật số lượng tổng, tự động điều chỉnh số lượng khả dụng
    @Transactional
    public void assignBookToCabinet(Long bookId, Long cabinetId, int quantity) {
        Optional<BookInventory> existing = bookInventoryRepository.findByBookIdAndCabinetId(bookId, cabinetId);

        if (existing.isPresent()) {
            BookInventory inv = existing.get();
            inv.setActive(true);
            inv.setTotalQuantity(inv.getTotalQuantity() + quantity);
            inv.setAvailableQuantity(inv.getAvailableQuantity() + quantity);
            bookInventoryRepository.save(inv);
        } else {
            Book book = bookRepository.findByIdAndIsActiveTrue(bookId)
                    .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));
            Cabinet cabinet = cabinetRepository.findById(cabinetId)
                    .orElseThrow(() -> new AppException(ErrorCode.CABINET_NOT_FOUND));

            BookInventory newInv = BookInventory.builder()
                    .book(book)
                    .cabinet(cabinet)
                    .totalQuantity(quantity)
                    .availableQuantity(quantity)
                    .isActive(true)
                    .build();
            bookInventoryRepository.save(newInv);
        }
    }

    @Transactional
    public BookInventoryResponse updateInventory(Long inventoryId, BookInventoryUpdateRequest request) {
        BookInventory inventory = bookInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));

        // Tính toán độ lệch để cập nhật available_quantity tương ứng
        int diff = request.quantity() - inventory.getTotalQuantity();
        
        // Kiểm tra nếu giảm số lượng quá mức sách đang cho mượn
        if (inventory.getAvailableQuantity() + diff < 0) {
            throw new AppException(ErrorCode.INVALID_BOOK_QUANTITY); 
        }

        inventory.setTotalQuantity(request.quantity());
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + diff);

        return mapToResponse(bookInventoryRepository.save(inventory));
    }

    @Transactional
    public void deleteInventory(Long inventoryId) {
        // Thay vì xóa vật lý, ta dùng removeBookFromCabinet 
        removeBookFromCabinet(inventoryId);
    }

    @Transactional
    public void removeBookFromCabinet(Long inventoryId) {
        BookInventory inventory = bookInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new AppException(ErrorCode.INVENTORY_NOT_FOUND));

        if (inventory.getAvailableQuantity() < inventory.getTotalQuantity()) {
            throw new AppException(ErrorCode.CANNOT_REMOVE_CABINET_WHILE_BORROWED);
        }

        inventory.setActive(false);
        inventory.setTotalQuantity(0); // Tùy chọn: đưa về 0 nếu muốn xóa hẳn khỏi tổng
        inventory.setAvailableQuantity(0);
        bookInventoryRepository.save(inventory);
    }

    // --- Các hàm Read ---

    public List<BookInventoryResponse> getInventoriesByBookId(Long bookId) {
        return bookInventoryRepository.findByBookIdAndIsActiveTrue(bookId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public BookInventoryResponse getInventoryById(Long inventoryId) {
        return bookInventoryRepository.findById(inventoryId)
                .filter(BookInventory::isActive)
                .map(this::mapToResponse)
                .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));
    }

    public BookInventoryResponse getInventoryByBookAndCabinet(Long bookId, Long cabinetId) {
        // Phải thêm filter isActive để tránh lấy nhầm dữ liệu đã xóa ẩn
        BookInventory inventory = bookInventoryRepository.findByBookIdAndCabinetId(bookId, cabinetId)
                .filter(BookInventory::isActive)
                .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));

        return mapToResponse(inventory);
    }

    public List<BookInventoryResponse> getInventoriesByCabinetId(Long cabinetId) {
        // Giả sử bạn đã có method này trong Repository
        return bookInventoryRepository.findByCabinetIdAndIsActiveTrue(cabinetId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private BookInventoryResponse mapToResponse(BookInventory inventory) {
        return BookInventoryResponse.builder()
                .id(inventory.getId())
                .bookId(inventory.getBook().getId())
                .bookTitle(inventory.getBook().getTitle())
                .cabinetId(inventory.getCabinet().getId())
                .cabinetName(inventory.getCabinet().getTen())
                .totalInCabinet(inventory.getTotalQuantity())      // Khớp với DTO Response của bạn
                .availableInCabinet(inventory.getAvailableQuantity()) // Khớp với DTO Response của bạn
                .build();
    }
}
