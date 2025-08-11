package com.ssafy.keepick.auth.application;

import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.ssafy.keepick.auth.persistence.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenRevokerService {

    private final RefreshTokenRepository repository;

    // 토큰 상태
    private static final String STATUS_REVOKED = "REVOKED";
    
    // 패밀리 상태
    private static final String FAMILY_STATUS_REVOKED = "REVOKED";

    /**
     * 리프레시 토큰을 통해 해당 패밀리의 모든 토큰을 폐기합니다.
     * 
     * @param rtJti 리프레시 토큰 JWT ID
     */
    public void revokeByRt(String rtJti) {
        Map<Object, Object> tokenData = repository.getToken(rtJti);

        if (tokenData.isEmpty()) {
            log.warn("폐기할 리프레시 토큰이 존재하지 않음: jti={}", rtJti);
            return;
        }

        String familyId = (String) tokenData.get("family_id");
        if (familyId == null) {
            log.warn("패밀리 ID가 없는 토큰: jti={}", rtJti);
            return;
        }

        // 패밀리 상태를 REVOKED로 설정
        repository.setFamilyStatus(familyId, FAMILY_STATUS_REVOKED);

        // 패밀리 그룹의 모든 토큰을 안전하게 REVOKED로 표시
        Set<String> familyTokens = repository.getFamilyTokens(familyId);

        int revokedCount = 0;
        for (String jti : familyTokens) {
            String tokenKey = repository.getTokenKey(jti);
            // EXISTS 체크로 만료된 키 부활 방지
            if (repository.exists(tokenKey)) {
                repository.putHashField(tokenKey, "status", STATUS_REVOKED);
                repository.putHashField(tokenKey, "revoked_at_ms", String.valueOf(System.currentTimeMillis()));
                revokedCount++;
            }
        }

        // 패밀리 그룹 삭제
        String familyKey = repository.getFamilyKey(familyId);
        repository.delete(familyKey);

        log.info("패밀리 토큰 폐기 완료: familyId={}, totalTokens={}, revokedTokens={}", 
                familyId, familyTokens.size(), revokedCount);
    }

    /**
     * 특정 사용자의 모든 리프레시 토큰을 폐기합니다.
     * 
     * @param memberId 사용자 ID
     */
    public void revokeByMember(Long memberId) {
        // 사용자별 패밀리 인덱스를 통해 효율적으로 폐기
        Set<String> families = repository.getMemberFamilies(memberId);
        
        int revokedFamilies = 0;
        for (String familyId : families) {
            revokeByFamily(familyId);
            revokedFamilies++;
        }
        
        // 사용자별 패밀리 인덱스 삭제
        String memberFamiliesKey = repository.getMemberFamiliesKey(memberId);
        repository.delete(memberFamiliesKey);

        log.info("사용자 토큰 폐기 완료: memberId={}, revokedFamilies={}", memberId, revokedFamilies);
    }

    /**
     * 특정 패밀리의 모든 토큰을 폐기합니다.
     * 
     * @param familyId 패밀리 ID
     */
    public void revokeByFamily(String familyId) {
        // 패밀리 상태를 REVOKED로 설정
        repository.setFamilyStatus(familyId, FAMILY_STATUS_REVOKED);

        // 패밀리 그룹의 모든 토큰을 안전하게 REVOKED로 표시
        Set<String> familyTokens = repository.getFamilyTokens(familyId);

        int revokedCount = 0;
        for (String jti : familyTokens) {
            String tokenKey = repository.getTokenKey(jti);
            // EXISTS 체크로 만료된 키 부활 방지
            if (repository.exists(tokenKey)) {
                repository.putHashField(tokenKey, "status", STATUS_REVOKED);
                repository.putHashField(tokenKey, "revoked_at_ms", String.valueOf(System.currentTimeMillis()));
                revokedCount++;
            }
        }

        // 패밀리 그룹 삭제
        String familyKey = repository.getFamilyKey(familyId);
        repository.delete(familyKey);

        log.info("패밀리 토큰 폐기 완료: familyId={}, totalTokens={}, revokedTokens={}", 
                familyId, familyTokens.size(), revokedCount);
    }
}
