package com.library.libraryManager.config;

import org.springframework.context.annotation.Configuration;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.servers.Server;

import java.util.List;

@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI customOpenAPI(   @Value("${open.api.title}") String title,
                                    @Value("${open.api.version}") String version,               
                                    @Value("${open.api.description}") String description,
                                    @Value("${open.api.serverUrl}") String serverUrl,
                                    @Value("${open.api.serverName}") String serverName
                                    ) {
        
        // 1. Định nghĩa cơ chế bảo mật (Security Scheme)
        final String securitySchemeName = "bearerAuth";
        
        return new OpenAPI()
                .info(new Info()
                        .title(title)
                        .version(version)
                        .description(description)
                        .license(new License().name("MIT").url("https://opensource.org/licenses/MIT")))
                .servers(List.of(new Server().url(serverUrl).description(serverName)))
                // 2. Thêm cấu hình Security Components
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, 
                            new io.swagger.v3.oas.models.security.SecurityScheme()
                                .name(securitySchemeName)
                                .type(io.swagger.v3.oas.models.security.SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                // 3. Áp dụng bảo mật cho toàn bộ các API trong tài liệu
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName));
    }

    @Bean
    public GroupedOpenApi groupedOpenApi() {
        return GroupedOpenApi.builder()
                .group("Library Management API")
                .pathsToMatch("/api/v1/**")
                .build();
    }

}
