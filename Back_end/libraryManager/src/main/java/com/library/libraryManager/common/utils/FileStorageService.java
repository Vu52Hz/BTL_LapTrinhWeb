package com.library.libraryManager.common.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file, String subDir) {
        try {
            // 1. Lấy đường dẫn tuyệt đối của thư mục upload
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path subPath = uploadPath.resolve(subDir);
            // 2. Tạo thư mục nếu chưa tồn tại
            if (!Files.exists(subPath)) {
                Files.createDirectories(subPath);
            }

            // 3. Đặt tên file duy nhất để tránh trùng lặp
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            
            // 4. Xác định vị trí lưu file cụ thể
            Path targetLocation = subPath.resolve(fileName);

            // 5. Chép file vào thư mục (Ghi đè nếu đã tồn tại - dù UUID rất khó trùng)
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 6. Trả về đường dẫn tương đối để lưu vào Database
            // Sau này FE sẽ gọi: http://localhost:8080/uploads/tên-file.jpg
            return "/uploads/" + subDir + "/" + fileName;
            
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu trữ file. Lỗi: " + ex.getMessage());
        }
    }
}