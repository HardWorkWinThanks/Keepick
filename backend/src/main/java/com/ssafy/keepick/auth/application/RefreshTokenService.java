package com.ssafy.keepick.auth.application;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.ssafy.keepick.auth.application.dto.RefreshCtx;
import com.ssafy.keepick.auth.persistence.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final RefreshTokenRotatorService rotator;
    private final RefreshTokenIssuerService issuer;
    private final RefreshTokenRevokerService revoker;

    /**
     * 리프레시 토큰을 발급합니다.
     * 
     * @param memberId 사용자 ID
     * @param username 사용자명
     * @param familyId 패밀리 ID
     * @return 발급된 JWT ID
     */
    public String issue(Long memberId, String username, String familyId) {
        return issuer.issue(memberId, username, familyId);
    }

    /**
     * 리프레시 토큰을 검증하고 회전시킵니다.
     * 
     * @param rtJti 리프레시 토큰 JWT ID
     * @return 토큰 회전 컨텍스트
     */
    public RefreshCtx validateAndRotate(String rtJti) {
        return rotator.rotate(rtJti);
    }

    /**
     * 리프레시 토큰을 사용됨으로 표시합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     */
    public void markUsed(String jti) {
        String tokenKey = repository.getTokenKey(jti);
        repository.putHashField(tokenKey, "status", "USED");
        repository.putHashField(tokenKey, "last_used_at_ms", String.valueOf(System.currentTimeMillis()));
        log.debug("리프레시 토큰 사용 표시: jti={}", jti);
    }

    /**
     * 리프레시 토큰을 통해 해당 패밀리의 모든 토큰을 폐기합니다.
     * 
     * @param rtJti 리프레시 토큰 JWT ID
     */
    public void revokeByRt(String rtJti) {
        revoker.revokeByRt(rtJti);
    }

    /**
     * 특정 사용자의 모든 리프레시 토큰을 폐기합니다.
     * 
     * @param memberId 사용자 ID
     */
    public void revokeByMember(Long memberId) {
        revoker.revokeByMember(memberId);
    }

    /**
     * 특정 패밀리의 모든 토큰을 폐기합니다.
     * 
     * @param familyId 패밀리 ID
     */
    public void revokeByFamily(String familyId) {
        revoker.revokeByFamily(familyId);
    }

    /**
     * 패밀리 상태를 확인합니다.
     * 
     * @param familyId 패밀리 ID
     * @return 패밀리 상태 (COMPROMISED, REVOKED, null=정상)
     */
    public String getFamilyStatus(String familyId) {
        return repository.getFamilyStatus(familyId);
    }

    /**
     * 패밀리가 정상 상태인지 확인합니다.
     * 
     * @param familyId 패밀리 ID
     * @return 정상 상태 여부
     */
    public boolean isFamilyHealthy(String familyId) {
        String status = getFamilyStatus(familyId);
        return status == null; // 상태가 없으면 정상
    }

    /**
     * 리프레시 토큰이 존재하는지 확인합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     * @return 토큰 존재 여부
     */
    public boolean exists(String jti) {
        String key = repository.getTokenKey(jti);
        return repository.exists(key);
    }

    /**
     * 리프레시 토큰을 삭제합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     */
    public void delete(String jti) {
        String tokenKey = repository.getTokenKey(jti);
        
        // 토큰 정보 조회 (패밀리 ID 추출용)
        Map<Object, Object> tokenData = repository.getToken(jti);
        String familyId = null;
        if (!tokenData.isEmpty()) {
            familyId = (String) tokenData.get("family_id");
        }
        
        // 토큰 삭제
        boolean deleted = repository.delete(tokenKey);
        
        // 패밀리 세트에서도 제거 (잔여 참조 방지)
        if (familyId != null && deleted) {
            repository.removeFromFamily(familyId, jti);
            
            // 패밀리 세트가 비어있으면 삭제
            Long size = repository.getFamilySize(familyId);
            if (size != null && size == 0) {
                String familyKey = repository.getFamilyKey(familyId);
                repository.delete(familyKey);
            }
        }

        log.debug("리프레시 토큰 삭제: jti={}, deleted={}, familyId={}", jti, deleted, familyId);
    }

    /**
     * 리프레시 토큰 정보를 조회합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     * @return 토큰 정보 맵
     */
    public Map<Object, Object> get(String jti) {
        return repository.getToken(jti);
    }
}
