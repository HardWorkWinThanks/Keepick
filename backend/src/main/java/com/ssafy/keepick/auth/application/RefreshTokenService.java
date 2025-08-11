package com.ssafy.keepick.auth.application;

import java.time.Duration;
import java.util.Map;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    
    private final StringRedisTemplate stringRedisTemplate;
    
    /**
     * 활성 상태의 리프레시 토큰을 저장합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     * @param fields 저장할 필드들 (member_id, family_id, status=ACTIVE, exp 등)
     * @param ttl 토큰 만료 시간
     */
    public void saveActive(String jti, Map<String, String> fields, Duration ttl) {
        String key = "rt:" + jti;
        stringRedisTemplate.opsForHash().putAll(key, fields);
        stringRedisTemplate.expire(key, ttl);
        
        log.debug("리프레시 토큰 저장 완료: jti={}, ttl={}", jti, ttl);
    }
    
    /**
     * 리프레시 토큰 정보를 조회합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     * @return 토큰 정보 맵
     */
    public Map<Object, Object> get(String jti) {
        String key = "rt:" + jti;
        Map<Object, Object> entries = stringRedisTemplate.opsForHash().entries(key);
        
        log.debug("리프레시 토큰 조회: jti={}, exists={}", jti, !entries.isEmpty());
        return entries;
    }
    
    /**
     * 리프레시 토큰을 사용됨으로 표시합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     */
    public void markUsed(String jti) {
        String key = "rt:" + jti;
        stringRedisTemplate.opsForHash().put(key, "status", "USED");
        stringRedisTemplate.opsForHash().put(key, "last_used_at", String.valueOf(System.currentTimeMillis()));
        
        log.debug("리프레시 토큰 사용 표시: jti={}", jti);
    }
    
    /**
     * 리프레시 토큰이 존재하는지 확인합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     * @return 토큰 존재 여부
     */
    public boolean exists(String jti) {
        String key = "rt:" + jti;
        Boolean hasKey = stringRedisTemplate.hasKey(key);
        
        log.debug("리프레시 토큰 존재 확인: jti={}, exists={}", jti, hasKey);
        return Boolean.TRUE.equals(hasKey);
    }
    
    /**
     * 리프레시 토큰을 삭제합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     */
    public void delete(String jti) {
        String key = "rt:" + jti;
        Boolean deleted = stringRedisTemplate.delete(key);
        
        log.debug("리프레시 토큰 삭제: jti={}, deleted={}", jti, deleted);
    }
}
