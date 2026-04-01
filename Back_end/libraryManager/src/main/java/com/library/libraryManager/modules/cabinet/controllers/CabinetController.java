package com.library.libraryManager.modules.cabinet.controllers;

import com.library.libraryManager.common.dtos.ApiResponse;
import com.library.libraryManager.modules.cabinet.dtos.requests.CabinetRequest;
import com.library.libraryManager.modules.cabinet.dtos.responses.CabinetResponse;
import com.library.libraryManager.modules.cabinet.service.CabinetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cabinets")
@RequiredArgsConstructor
public class CabinetController {

    private final CabinetService cabinetService;

    @GetMapping
    public ApiResponse<List<CabinetResponse>> getAll(@RequestParam(required = false) String ten) {
        return ApiResponse.<List<CabinetResponse>>builder()
                .result(cabinetService.getAll(ten))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CabinetResponse> getById(@PathVariable Long id) {
        return ApiResponse.<CabinetResponse>builder()
                .result(cabinetService.getById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CabinetResponse> create(@RequestBody @Valid CabinetRequest request) {
        return ApiResponse.<CabinetResponse>builder()
                .message("Thêm tủ sách mới thành công")
                .result(cabinetService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CabinetResponse> update(@PathVariable Long id, @RequestBody @Valid CabinetRequest request) {
        return ApiResponse.<CabinetResponse>builder()
                .message("Cập nhật tủ sách thành công")
                .result(cabinetService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        cabinetService.delete(id);
        return ApiResponse.<Void>builder()
                .message("Xóa tủ sách thành công")
                .build();
    }
}