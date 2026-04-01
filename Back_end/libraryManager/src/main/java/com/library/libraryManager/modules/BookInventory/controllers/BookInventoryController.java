package com.library.libraryManager.modules.BookInventory.controllers;

import com.library.libraryManager.common.dtos.ApiResponse;
import com.library.libraryManager.modules.BookInventory.dtos.requests.BookInventoryCreateRequest;
import com.library.libraryManager.modules.BookInventory.dtos.requests.BookInventoryUpdateRequest;
import com.library.libraryManager.modules.BookInventory.dtos.responses.BookInventoryResponse;
import com.library.libraryManager.modules.BookInventory.service.BookInventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/book-inventory")
@RequiredArgsConstructor
public class BookInventoryController {
    private final BookInventoryService bookInventoryService;

    /**
     * Thêm sách vào tủ hoặc cập nhật số lượng nếu sách đã có trong tủ đó
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BookInventoryResponse> createInventory(@RequestBody @Valid BookInventoryCreateRequest request) {
        return ApiResponse.<BookInventoryResponse>builder()
                .message("Cập nhật thông tin tủ sách thành công")
                .result(bookInventoryService.createInventory(request))
                .build();
    }

    /**
     * Cập nhật số lượng tổng trong một tủ cụ thể
     * (Sẽ tự động tính toán lại số lượng khả dụng)
     */
    @PutMapping("/{inventoryId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BookInventoryResponse> updateInventory(
            @PathVariable Long inventoryId,
            @RequestBody @Valid BookInventoryUpdateRequest request
    ) {
        return ApiResponse.<BookInventoryResponse>builder()
                .message("Cập nhật số lượng sách trong tủ thành công")
                .result(bookInventoryService.updateInventory(inventoryId, request))
                .build();
    }

    /**
     * Gỡ một đầu sách hoàn toàn khỏi một tủ (Soft Delete)
     */
    @DeleteMapping("/{inventoryId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteInventory(@PathVariable Long inventoryId) {
        // Sử dụng logic removeBookFromCabinet để check điều kiện mượn trước khi ẩn
        bookInventoryService.removeBookFromCabinet(inventoryId);
        return ApiResponse.<Void>builder()
                    // Thông báo này chuyên nghiệp hơn là "Xóa kho"
                .message("Đã gỡ đầu sách khỏi tủ thành công") 
                .build();
    }

    /**
     * Lấy tất cả inventory của một sách
     */
    @GetMapping("/book/{bookId}")
    public ApiResponse<List<BookInventoryResponse>> getInventoriesByBook(@PathVariable Long bookId) {
        return ApiResponse.<List<BookInventoryResponse>>builder()
                .result(bookInventoryService.getInventoriesByBookId(bookId))
                .build();
    }

    /**
     * Lấy tất cả inventory của một tủ
     */
    @GetMapping("/cabinet/{cabinetId}")
    public ApiResponse<List<BookInventoryResponse>> getInventoriesByCabinet(@PathVariable Long cabinetId) {
        return ApiResponse.<List<BookInventoryResponse>>builder()
                .result(bookInventoryService.getInventoriesByCabinetId(cabinetId))
                .build();
    }

    /**
     * Lấy inventory của một sách trong một tủ cụ thể
     */
    @GetMapping("/book/{bookId}/cabinet/{cabinetId}")
    public ApiResponse<BookInventoryResponse> getInventory(
            @PathVariable Long bookId,
            @PathVariable Long cabinetId
    ) {
        return ApiResponse.<BookInventoryResponse>builder()
                .result(bookInventoryService.getInventoryByBookAndCabinet(bookId, cabinetId))
                .build();
    }

    /**
     * Lấy chi tiết inventory
     */
    @GetMapping("/{inventoryId}")
    public ApiResponse<BookInventoryResponse> getInventoryById(@PathVariable Long inventoryId) {
        return ApiResponse.<BookInventoryResponse>builder()
                .result(bookInventoryService.getInventoryById(inventoryId))
                .build();
    }

}
