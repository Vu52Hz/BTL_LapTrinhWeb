package com.library.libraryManager.common.utils;

import com.library.libraryManager.common.dtos.ApiResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;



@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {
    private final FileStorageService fileStorageService;

    @PostMapping("/upload/{type}")
    public ApiResponse<String> uploadFile(
        @RequestParam("file") MultipartFile file,
        @PathVariable("type") String type // 'books' hoặc 'rooms'
    ) {
        // Truyền type vào service để nó chọn thư mục
        String fileUrl = fileStorageService.storeFile(file, type);
        return ApiResponse.<String>builder()
                .result(fileUrl)
                .message("Upload thành công vào thư mục " + type)
                .build();
    }
}