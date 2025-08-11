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
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

/**
 * 간단한 재사용 테스트
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@org.springframework.test.context.ActiveProfiles("test")
class SimpleRefreshTest {

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

    @Test
    void test_reuse_detection() throws Exception {
        // Given
        String familyId = UUID.randomUUID().toString();
        String oldJti = seedActiveRt(7L, "user@test.com", familyId, Duration.ofDays(30));

        System.out.println("=== 1차 정상 회전 ===");
        // 1차 정상 회전
        mvc.perform(post("/api/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldJti + "\"}"))
                .andDo(print());

        System.out.println("=== 2차 재사용 시도 ===");
        // 2차: 옛 JTI 재사용 시도
        mvc.perform(post("/api/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldJti + "\"}"))
                .andDo(print());
    }
}
