package com.library.libraryManager.modules.book.controllers;

import com.library.libraryManager.common.dtos.ApiResponse;
import com.library.libraryManager.modules.book.dtos.requests.BookCreateRequest;
import com.library.libraryManager.modules.book.dtos.requests.BookUpdateRequest;
import com.library.libraryManager.modules.book.dtos.responses.BookResponse;
import com.library.libraryManager.modules.book.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;

    @GetMapping
    public ApiResponse<List<BookResponse>> getAll(@RequestParam(required = false) String keyword) {
        return ApiResponse.<List<BookResponse>>builder()
                .result(bookService.getAll(keyword))
                .build();
    }
    
    @GetMapping("/top-borrowed-today")
    public ApiResponse<List<BookResponse>> getTop10BorrowedBooksToday() {
        return ApiResponse.<List<BookResponse>>builder()
                .message("Lấy danh sách 10 cuốn sách mượn nhiều nhất gần đây")
                .result(bookService.getTop10BorrowedBooksRecently())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<BookResponse> getById(@PathVariable Long id) {
        return ApiResponse.<BookResponse>builder()
                .result(bookService.getById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<BookResponse>> create(@RequestBody @Valid BookCreateRequest request) {
        return ApiResponse.<List<BookResponse>>builder()
                .message("Thêm sách vào thư viện thành công")
                .result(bookService.createBooks(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BookResponse> update(
            @PathVariable Long id, 
            @RequestBody @Valid BookUpdateRequest request
    ) {
        return ApiResponse.<BookResponse>builder()
                .message("Cập nhật thông tin sách thành công")
                .result(bookService.updateBook(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        bookService.delete(id);
        return ApiResponse.<Void>builder()
                .message("Xóa sách thành công")
                .build();
    }
}