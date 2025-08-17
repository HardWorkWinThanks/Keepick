package com.ssafy.keepick.auth.integration;

import com.ssafy.keepick.auth.persistence.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

/**
 * 인증 토큰 갱신 통합 테스트 (간단 버전)
 * 실제 Redis + Lua 스크립트를 사용하여 기본 플로우를 테스트
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // 보안 필터 비활성화
@org.springframework.test.context.ActiveProfiles("test")
class AuthRefreshIntegrationTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void redisProps(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", () -> "localhost");
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired
    private MockMvc mvc;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    /**
     * 헬퍼 메서드: 활성 리프레시 토큰을 Redis에 시드
     */
    private String seedActiveRt(Long memberId, String username, String familyId, Duration ttl) {
        String jti = UUID.randomUUID().toString();
        Map<String, String> fields = new HashMap<>();
        fields.put("member_id", String.valueOf(memberId));
        fields.put("username", username == null ? "" : username);
        fields.put("family_id", familyId);
        fields.put("status", "ACTIVE");
        fields.put("issued_at_ms", String.valueOf(System.currentTimeMillis()));
        fields.put("exp_sec", String.valueOf(Instant.now().getEpochSecond() + ttl.getSeconds()));

        refreshTokenRepository.putToken(jti, fields, ttl);
        redisTemplate.opsForSet().add("family:" + familyId, jti);
        redisTemplate.expire("family:" + familyId, ttl);
        
        return jti;
    }

    /**
     * 모바일 리프레시 해피 패스 테스트
     * 바디에서 토큰을 읽어 바디로 응답하고, 쿠키는 설정하지 않음
     */
    @Test
    void mobile_refresh_should_rotate_and_return_both_tokens() throws Exception {
        // Given
        String familyId = UUID.randomUUID().toString();
        String oldJti = seedActiveRt(7L, "user@test.com", familyId, Duration.ofDays(30));

        // When & Then
        mvc.perform(post("/api/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldJti + "\"}"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists());
    }

    /**
     * 재사용(도난/중복 요청) 탐지 테스트
     * 회전 후 옛 토큰으로 다시 요청하면 401 refresh_token_reused
     */
    @Test
    void reuse_should_flag_family_and_return_401() throws Exception {
        // Given
        String familyId = UUID.randomUUID().toString();
        String oldJti = seedActiveRt(7L, "user@test.com", familyId, Duration.ofDays(30));

        // 1차 정상 회전
        mvc.perform(post("/api/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldJti + "\"}"))
                .andExpect(status().isOk());

        // 2차: 옛 JTI 재사용 시도
        mvc.perform(post("/api/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldJti + "\"}"))
                .andDo(print())
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("A005"));
    }
}
