package com.ssafy.keepick.global.config;

import com.ssafy.keepick.global.interceptor.GroupAlbumInterceptor;
import com.ssafy.keepick.global.interceptor.GroupMemberInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final GroupMemberInterceptor groupMemberInterceptor;
    private final GroupAlbumInterceptor groupAlbumInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 그룹 멤버 검사
        registry.addInterceptor(groupMemberInterceptor)
                .addPathPatterns("/api/groups/**")
                .excludePathPatterns("/api/groups");

        // 그룹 앨범 검사 (그룹 멤버 검사 이후에 실행)
        registry.addInterceptor(groupAlbumInterceptor)
                .addPathPatterns(
                        "/api/groups/*/timeline-albums/**",
                        "/api/groups/*/tier-albums/**",
                        "/api/groups/*/highlight-albums/**"
                );
    }
}
