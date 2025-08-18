package com.ssafy.keepick.global.config;

import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {
    @Value("${app.dev.url}")
    String devServer;
    @Bean
    public OpenAPI openAPI() {
        String jwt = "accessToken";
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(jwt);
        Components components = new Components().addSecuritySchemes(jwt, new SecurityScheme()
                .name(jwt)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
        );
        return new OpenAPI()
                .components(components)
                .info(apiInfo())
                .addSecurityItem(securityRequirement)
                .components(components)
                .servers(List.of(
                        new io.swagger.v3.oas.models.servers.Server().url(devServer),
                        new io.swagger.v3.oas.models.servers.Server().url("http://localhost:8080")
                ));
    }
    private Info apiInfo() {
        return new Info()
                .title("Keepick API Docs")
                .description("Keepick의 API 명세입니다.")
                .version("1.0.0");
    }
}