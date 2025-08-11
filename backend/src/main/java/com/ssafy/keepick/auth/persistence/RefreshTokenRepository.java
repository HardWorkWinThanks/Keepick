package com.ssafy.keepick.auth.persistence;

import java.time.Duration;
import java.util.Map;
import java.util.Set;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
@RequiredArgsConstructor
public class RefreshTokenRepository {

    private final StringRedisTemplate stringRedisTemplate;

    // Redis 키 접두사
    private static final String RT_KEY_PREFIX = "rt:";
    private static final String FAMILY_KEY_PREFIX = "family:";
    private static final String FAMILY_STATUS_KEY_PREFIX = "family_status:";
    private static final String MEMBER_FAMILIES_KEY_PREFIX = "member:";
    
    // 기본 TTL (30일)
    private static final Duration DEFAULT_TTL = Duration.ofDays(30);

    /**
     * 리프레시 토큰 정보를 조회합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     * @return 토큰 정보 맵 (빈 맵이면 토큰이 존재하지 않음)
     */
    public Map<Object, Object> getToken(String jti) {
        String key = RT_KEY_PREFIX + jti;
        Map<Object, Object> entries = stringRedisTemplate.opsForHash().entries(key);
        
        log.debug("리프레시 토큰 조회: jti={}, exists={}", jti, !entries.isEmpty());
        return entries;
    }

    /**
     * 리프레시 토큰을 저장합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     * @param fields 토큰 필드들
     * @param ttl TTL
     */
    public void putToken(String jti, Map<String, String> fields, Duration ttl) {
        String key = RT_KEY_PREFIX + jti;
        stringRedisTemplate.opsForHash().putAll(key, fields);
        stringRedisTemplate.expire(key, ttl);
        
        log.debug("리프레시 토큰 저장: jti={}, ttl={}", jti, ttl);
    }

    /**
     * 키의 TTL을 설정합니다.
     * 
     * @param key Redis 키
     * @param ttl TTL
     */
    public void expire(String key, Duration ttl) {
        stringRedisTemplate.expire(key, ttl);
    }

    /**
     * 키가 존재하는지 확인합니다.
     * 
     * @param key Redis 키
     * @return 존재 여부
     */
    public boolean exists(String key) {
        Boolean hasKey = stringRedisTemplate.hasKey(key);
        return Boolean.TRUE.equals(hasKey);
    }

    /**
     * 키를 삭제합니다.
     * 
     * @param key Redis 키
     * @return 삭제 성공 여부
     */
    public boolean delete(String key) {
        Boolean deleted = stringRedisTemplate.delete(key);
        return Boolean.TRUE.equals(deleted);
    }

    /**
     * 패밀리 상태를 설정합니다.
     * 
     * @param familyId 패밀리 ID
     * @param status 상태값
     */
    public void setFamilyStatus(String familyId, String status) {
        String key = FAMILY_STATUS_KEY_PREFIX + familyId;
        stringRedisTemplate.opsForValue().set(key, status, DEFAULT_TTL);
    }

    /**
     * 패밀리 상태를 조회합니다.
     * 
     * @param familyId 패밀리 ID
     * @return 상태값 (null이면 정상)
     */
    public String getFamilyStatus(String familyId) {
        String key = FAMILY_STATUS_KEY_PREFIX + familyId;
        return stringRedisTemplate.opsForValue().get(key);
    }

    /**
     * 패밀리에 토큰을 추가합니다.
     * 
     * @param familyId 패밀리 ID
     * @param jti JWT ID
     */
    public void addToFamily(String familyId, String jti) {
        String key = FAMILY_KEY_PREFIX + familyId;
        stringRedisTemplate.opsForSet().add(key, jti);
        stringRedisTemplate.expire(key, DEFAULT_TTL);
    }

    /**
     * 패밀리에서 토큰을 제거합니다.
     * 
     * @param familyId 패밀리 ID
     * @param jti JWT ID
     */
    public void removeFromFamily(String familyId, String jti) {
        String key = FAMILY_KEY_PREFIX + familyId;
        stringRedisTemplate.opsForSet().remove(key, jti);
    }

    /**
     * 패밀리의 모든 토큰을 조회합니다.
     * 
     * @param familyId 패밀리 ID
     * @return 토큰 JTI 집합
     */
    public Set<String> getFamilyTokens(String familyId) {
        String key = FAMILY_KEY_PREFIX + familyId;
        Set<String> members = stringRedisTemplate.opsForSet().members(key);
        return members != null ? members : Set.of();
    }

    /**
     * 패밀리 세트의 크기를 조회합니다.
     * 
     * @param familyId 패밀리 ID
     * @return 세트 크기
     */
    public Long getFamilySize(String familyId) {
        String key = FAMILY_KEY_PREFIX + familyId;
        return stringRedisTemplate.opsForSet().size(key);
    }

    /**
     * 사용자에게 패밀리를 추가합니다.
     * 
     * @param memberId 사용자 ID
     * @param familyId 패밀리 ID
     */
    public void addMemberFamily(Long memberId, String familyId) {
        String key = MEMBER_FAMILIES_KEY_PREFIX + memberId + ":families";
        stringRedisTemplate.opsForSet().add(key, familyId);
        stringRedisTemplate.expire(key, DEFAULT_TTL);
    }

    /**
     * 사용자의 모든 패밀리를 조회합니다.
     * 
     * @param memberId 사용자 ID
     * @return 패밀리 ID 집합
     */
    public Set<String> getMemberFamilies(Long memberId) {
        String key = MEMBER_FAMILIES_KEY_PREFIX + memberId + ":families";
        Set<String> members = stringRedisTemplate.opsForSet().members(key);
        return members != null ? members : Set.of();
    }

    /**
     * 해시 필드를 업데이트합니다.
     * 
     * @param key Redis 키
     * @param field 필드명
     * @param value 필드값
     */
    public void putHashField(String key, String field, String value) {
        stringRedisTemplate.opsForHash().put(key, field, value);
    }

    /**
     * 리프레시 토큰 키를 생성합니다.
     * 
     * @param jti JWT ID
     * @return Redis 키
     */
    public String getTokenKey(String jti) {
        return RT_KEY_PREFIX + jti;
    }

    /**
     * 패밀리 키를 생성합니다.
     * 
     * @param familyId 패밀리 ID
     * @return Redis 키
     */
    public String getFamilyKey(String familyId) {
        return FAMILY_KEY_PREFIX + familyId;
    }

    /**
     * 패밀리 상태 키를 생성합니다.
     * 
     * @param familyId 패밀리 ID
     * @return Redis 키
     */
    public String getFamilyStatusKey(String familyId) {
        return FAMILY_STATUS_KEY_PREFIX + familyId;
    }

    /**
     * 사용자 패밀리 키를 생성합니다.
     * 
     * @param memberId 사용자 ID
     * @return Redis 키
     */
    public String getMemberFamiliesKey(Long memberId) {
        return MEMBER_FAMILIES_KEY_PREFIX + memberId + ":families";
    }
}
