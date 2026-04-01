package com.library.libraryManager.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. Lấy đường dẫn tuyệt đối của thư mục uploads trên ổ cứng
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        // 2. Chuyển đổi đường dẫn sang định dạng URI (file:/C:/...)
        // Đây là cách an toàn nhất để Spring Boot hiểu đường dẫn vật lý
        String uploadResource = uploadPath.toUri().toString();

        // 3. Ánh xạ: Bất kỳ URL nào bắt đầu bằng /uploads/ 
        // sẽ được Spring tìm kiếm trong thư mục vật lý tương ứng
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadResource);
    }
}