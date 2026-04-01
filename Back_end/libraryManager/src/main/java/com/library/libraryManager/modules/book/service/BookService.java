package com.library.libraryManager.modules.book.service;

import com.library.libraryManager.common.exception.AppException;
import com.library.libraryManager.common.exception.ErrorCode;
import com.library.libraryManager.modules.book.dtos.requests.BookCreateRequest;
import com.library.libraryManager.modules.book.dtos.requests.BookUpdateRequest;
import com.library.libraryManager.modules.book.dtos.responses.BookResponse;
import com.library.libraryManager.modules.book.entities.Book;
import com.library.libraryManager.modules.book.repositories.BookRepository;
import com.library.libraryManager.modules.BookInventory.entities.BookInventory;
import com.library.libraryManager.modules.BookInventory.repositories.BookInventoryRepository;
import com.library.libraryManager.modules.booking.repositories.BookingRepository;
import com.library.libraryManager.modules.cabinet.entities.Cabinet;
import com.library.libraryManager.modules.cabinet.repositories.CabinetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final BookInventoryRepository bookInventoryRepository;
    private final CabinetRepository cabinetRepository;
    private final BookingRepository bookingRepository;

    /**
     * Lấy Top 10 sách từ 100 lượt booking gần nhất kèm tồn kho chi tiết
     */
    public List<BookResponse> getTop10BorrowedBooksRecently() {
        List<Book> topBooks = bookingRepository.findTop10BooksInLast100Bookings();
        
        return topBooks.stream()
                .map(this::mapToBookResponseWithInventories) // Dùng hàm map đầy đủ để hiện tủ
                .toList();
    }

    public List<BookResponse> getAll(String keyword) {
        List<Book> books;
        if (keyword != null && !keyword.isEmpty()) {
            books = bookRepository.searchByTitleOrAuthorAndIsActiveTrue(keyword);
        } else {
            books = bookRepository.findAllByIsActiveTrue();
        }
        
        return books.stream()
                .map(this::mapToBookResponseWithInventories)
                .toList();
    }

    @Transactional
    public List<BookResponse> createBooks(BookCreateRequest request) {
        int year = request.publishYear() != null ? request.publishYear() : 0;
        
        if (bookRepository.existsByTitleAndAuthorAndPublishYearAndIsActiveTrue(
                request.title(), request.author(), year)) {
            throw new AppException(ErrorCode.BOOK_ALREADY_EXISTS); 
        }

        Book newBook = Book.builder()
                .title(request.title())
                .author(request.author())
                .publishYear(year)
                .imageUrl(request.imageUrl())
                .isActive(true)
                .build();

        final Book savedBook = bookRepository.save(newBook);

        // Map Cabinet Assignments
        List<Long> cabinetIds = request.assignments().stream()
                .map(BookCreateRequest.CabinetAssignment::idCabinet).toList();
        
        Map<Long, Cabinet> cabinetMap = cabinetRepository.findAllById(cabinetIds).stream()
                .collect(Collectors.toMap(Cabinet::getId, c -> c));

        List<BookInventory> inventories = request.assignments().stream().map(assign -> {
            Cabinet cabinet = cabinetMap.get(assign.idCabinet());
            if (cabinet == null) throw new AppException(ErrorCode.CABINET_NOT_FOUND);

            return BookInventory.builder()
                    .book(savedBook)
                    .cabinet(cabinet)
                    .totalQuantity(assign.quantity())     // Correct field
                    .availableQuantity(assign.quantity()) // Initial: available = total
                    .isActive(true)
                    .build();
        }).toList();

        bookInventoryRepository.saveAll(inventories);

        return List.of(mapToBookResponseWithInventories(savedBook));
    }

    @Transactional
    public BookResponse updateBook(Long id, BookUpdateRequest request) {
        Book book = bookRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));
        
        book.setTitle(request.title());
        book.setAuthor(request.author());
        book.setPublishYear(request.publishYear());
        book.setImageUrl(request.imageUrl());
        
        return mapToBookResponseWithInventories(bookRepository.save(book));
    }

    public BookResponse getById(Long id) {
        Book book = bookRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));
        return mapToBookResponseWithInventories(book);
    }

    @Transactional
    public void delete(Long id) {
        Book book = bookRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new AppException(ErrorCode.BOOK_NOT_FOUND));
        
        // 1. Ẩn sách
        book.setActive(false);
        bookRepository.save(book);

        // 2. Ẩn toàn bộ kho liên quan để không bị mượn nhầm
        List<BookInventory> inventories = bookInventoryRepository.findByBookIdAndIsActiveTrue(book.getId());
        inventories.forEach(inv -> inv.setActive(false));
        bookInventoryRepository.saveAll(inventories);
    }

    /**
     * Hàm mapping chuyên nghiệp: Tính tổng và liệt kê chi tiết từng tủ
     */
    private BookResponse mapToBookResponseWithInventories(Book book) {
        List<BookInventory> inventories = bookInventoryRepository.findByBookIdAndIsActiveTrue(book.getId());

        int totalSum = inventories.stream().mapToInt(BookInventory::getTotalQuantity).sum();
        int availableSum = inventories.stream().mapToInt(BookInventory::getAvailableQuantity).sum();

        List<BookResponse.InventoryDetailResponse> details = inventories.stream()
                .map(inv -> BookResponse.InventoryDetailResponse.builder()
                        .inventoryId(inv.getId())
                        .cabinetId(inv.getCabinet().getId())
                        .cabinetName(inv.getCabinet().getTen())
                        .totalInCabinet(inv.getTotalQuantity())
                        .availableInCabinet(inv.getAvailableQuantity())
                        .build())
                .toList();

        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .year(book.getPublishYear())
                .imageUrl(book.getImageUrl())
                .totalQuantity(totalSum)
                .availableQuantity(availableSum)
                .inventoryDetails(details)
                .build();
    }
}