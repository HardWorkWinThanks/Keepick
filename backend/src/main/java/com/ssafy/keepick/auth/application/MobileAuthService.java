package com.ssafy.keepick.auth.application;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.ssafy.keepick.auth.application.dto.OAuth2Provider;
import com.ssafy.keepick.auth.application.dto.GoogleProvider;
import com.ssafy.keepick.auth.application.dto.KakaoProvider;
import com.ssafy.keepick.auth.application.dto.NaverProvider;
import com.ssafy.keepick.auth.application.dto.MobileLoginDto;
import com.ssafy.keepick.auth.application.dto.MobileTokenRefreshDto;
import com.ssafy.keepick.auth.controller.request.MobileLoginRequest;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.JWTUtil;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.UUID;

/**
 * 모바일 인증 서비스
 * 모바일 앱의 소셜 로그인과 토큰 갱신을 처리
 * 지원 provider: google, kakao, naver
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MobileAuthService {
    
    private final MemberRepository memberRepository;
    private final JWTUtil jwtUtil;
    private final RestTemplate restTemplate;
    private final RefreshTokenService refreshTokenService;
    
    /**
     * 모바일 소셜 로그인 처리
     * @param request provider와 accessToken을 포함한 로그인 요청
     * @return 모바일 로그인 DTO
     */
    public MobileLoginDto login(MobileLoginRequest request) {
        String provider = request.getProvider().toLowerCase();
        String accessToken = request.getAccessToken();
        
        log.info("모바일 로그인 시도: provider = {}", provider);
        
        // 1. 각 provider별로 사용자 정보 조회
        OAuth2Provider oauth2Provider = getUserInfoFromProvider(provider, accessToken);
        
        // 2. 이메일로 기존 회원 조회
        String email = oauth2Provider.getEmail();
        Member existMember = memberRepository.findByEmail(email).orElse(null);
        
        Member member;
        
        // 3. 신규 회원 생성 또는 기존 회원 사용
        if (existMember == null) {
            // 3-1. 신규 회원 생성
            log.info("신규 회원 생성: 이메일 = {}, 제공자 = {}", email, provider);
            
            // 이메일에서 닉네임 자동 생성
            String nickname = Member.generateNicknameFromEmail(email);
            
            // 회원 엔티티 생성
            member = Member.builder()
                    .name(oauth2Provider.getName())
                    .email(email)
                    .nickname(nickname)
                    .profileUrl(oauth2Provider.getProfileUrl())
                    .provider(oauth2Provider.getProvider())
                    .providerId(oauth2Provider.getProviderId())
                    .build();
            
            member = memberRepository.save(member);
            log.info("회원 생성 완료: ID = {}", member.getId());
        } else {
            // 3-2. 기존 회원 사용
            log.info("기존 회원 로그인: ID = {}, 이메일 = {}", existMember.getId(), email);
            member = existMember;
        }
        
        // 4. JWT 토큰 생성 (memberId와 email을 username으로 사용)
        String jwtToken = jwtUtil.createToken(member.getId(), member.getEmail());
        
        // 5. 리프레시 토큰 발급 (새로운 패밀리 ID 생성)
        String familyId = UUID.randomUUID().toString();
        log.info("🆔 모바일 로그인 - 새로운 패밀리 ID 생성: familyId={}", familyId);
        
        String refreshTokenJti = refreshTokenService.issue(member.getId(), member.getEmail(), familyId);
        
        log.info("✅ 모바일 로그인 완료: 사용자 = {} (ID: {}), 패밀리 = {}, JTI = {}", 
                member.getEmail(), member.getId(), familyId, refreshTokenJti);
        
        return MobileLoginDto.of(jwtToken, refreshTokenJti);
    }
    
    /**
     * 모바일용 토큰 갱신
     * @param refreshToken 갱신할 리프레시 토큰
     * @return 모바일용 토큰 갱신 DTO
     */
    public MobileTokenRefreshDto refreshToken(String refreshToken) {
        log.info("모바일 토큰 갱신 요청 처리 시작");
        
        try {
            // 리프레시 토큰 검증 및 회전
            var refreshCtx = refreshTokenService.validateAndRotate(refreshToken);
            
            // 새로운 액세스 토큰 생성
            String newAccessToken = jwtUtil.createToken(refreshCtx.memberId(), refreshCtx.username());
            
            log.info("모바일 토큰 갱신 성공: 사용자 {} (ID: {}), 패밀리: {}, 만료시간: {}", 
                    refreshCtx.username(), refreshCtx.memberId(), refreshCtx.familyId(), refreshCtx.newRtExpiresEpochSec());
            
            return MobileTokenRefreshDto.of(newAccessToken, refreshCtx.newJti());
            
        } catch (BaseException e) {
            // BaseException은 그대로 재抛出
            throw e;
        } catch (Exception e) {
            log.error("모바일 토큰 갱신 실패: 리프레시 토큰 검증 중 오류 발생", e);
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }
    }
    
    /**
     * provider별로 사용자 정보를 조회하여 OAuth2Provider 객체로 변환
     * @param provider 소셜 로그인 제공자 (google, kakao, naver)
     * @param accessToken 모바일 SDK에서 발급받은 액세스 토큰
     * @return OAuth2Provider 구현체 (GoogleProvider, KakaoProvider, NaverProvider)
     * @throws BaseException 지원하지 않는 provider이거나 인증 실패 시
     */
    private OAuth2Provider getUserInfoFromProvider(String provider, String accessToken) {
        try {
            // 1. provider별 사용자 정보 API 호출
            Map<String, Object> userInfo = fetchUserInfo(provider, accessToken);
            
            // 2. provider별 응답 형식에 맞는 Provider 객체로 변환
            return switch (provider) {
                case "google" -> GoogleProvider.from(userInfo);
                case "kakao" -> KakaoProvider.from(userInfo);
                case "naver" -> NaverProvider.from(userInfo);
                default -> throw new BaseException(ErrorCode.UNSUPPORTED_OAUTH2_PROVIDER, 
                        "지원하지 않는 OAuth2 제공자: " + provider);
            };
        } catch (Exception e) {
            log.error("사용자 정보 조회 실패: provider = {}, error = {}", provider, e.getMessage());
            throw new BaseException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED, 
                    "OAuth2 인증에 실패했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 실제 HTTP 요청을 통해 provider의 사용자 정보 API를 호출
     * @param provider 소셜 로그인 제공자
     * @param accessToken Bearer 토큰으로 사용할 액세스 토큰
     * @return provider API에서 반환한 사용자 정보 Map
     * @throws RuntimeException API 호출 실패 시
     */
    private Map<String, Object> fetchUserInfo(String provider, String accessToken) {
        // 1. provider별 사용자 정보 API URL 조회
        String userInfoUri = getUserInfoUri(provider);
        
        // 2. Authorization Bearer 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        
        // 3. HTTP GET 요청 생성
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        // 4. RestTemplate을 통한 API 호출
        ResponseEntity<Map> response = restTemplate.exchange(
                userInfoUri,
                HttpMethod.GET,
                entity,
                Map.class
        );
        
        // 5. 응답 상태 검증
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("사용자 정보 조회 실패: " + response.getStatusCode());
        }
        
        // 6. 응답 데이터 반환
        @SuppressWarnings("unchecked")
        Map<String, Object> userInfo = response.getBody();
        return userInfo;
    }
    
    /**
     * provider별 사용자 정보 조회 API URL 반환
     * @param provider 소셜 로그인 제공자
     * @return 해당 provider의 사용자 정보 API URL
     * @throws RuntimeException 지원하지 않는 provider인 경우
     */
    private String getUserInfoUri(String provider) {
        return switch (provider) {
            case "google" -> "https://www.googleapis.com/oauth2/v2/userinfo";  // Google 사용자 정보 API
            case "kakao" -> "https://kapi.kakao.com/v2/user/me";              // Kakao 사용자 정보 API
            case "naver" -> "https://openapi.naver.com/v1/nid/me";            // Naver 사용자 정보 API
            default -> throw new RuntimeException("지원하지 않는 provider: " + provider);
        };
    }
}
