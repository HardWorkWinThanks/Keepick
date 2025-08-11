package com.ssafy.keepick.auth.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.keepick.auth.application.dto.WebTokenRefreshDto;
import com.ssafy.keepick.auth.application.dto.MobileTokenRefreshDto;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.JWTUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {
    
    private final JWTUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final MobileAuthService mobileAuthService;
    
    /**
     * 통합 토큰 갱신 처리
     * 웹/모바일 클라이언트를 자동 감지하여 적절한 처리 방식 선택
     * 
     * @param request HTTP 요청 객체
     * @param response HTTP 응답 객체 (웹의 경우 새로운 리프레시 토큰 쿠키 설정용)
     * @return 토큰 갱신 DTO (웹: WebTokenRefreshDto, 모바일: MobileTokenRefreshDto)
     * @throws BaseException 토큰이 없거나 유효하지 않은 경우
     */
    public Object refreshToken(HttpServletRequest request, HttpServletResponse response) {
        log.info("토큰 갱신 요청 처리 시작");
        
        // 웹/모바일 클라이언트 구분
        boolean isWebClient = isWebClient(request);
        
        if (isWebClient) {
            log.info("웹 클라이언트로 감지되어 웹용 토큰 갱신 처리");
            return refreshTokenForWeb(request, response);
        } else {
            log.info("모바일 클라이언트로 감지되어 모바일용 토큰 갱신 처리");
            return refreshTokenForMobile(request);
        }
    }
    
    /**
     * 웹/모바일 클라이언트 구분
     * 1. User-Agent 헤더 확인
     * 2. 쿠키 존재 여부 확인
     * 3. 모바일 앱 특화 헤더 확인
     */
    private boolean isWebClient(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        boolean hasRefreshTokenCookie = hasRefreshTokenCookie(request);
        
        log.debug("클라이언트 구분 - User-Agent: {}, 쿠키 존재: {}", userAgent, hasRefreshTokenCookie);
        
        // 모바일 앱 특화 헤더 확인
        String mobileAppHeader = request.getHeader("X-Mobile-App");
        if ("true".equals(mobileAppHeader)) {
            log.debug("모바일 앱 헤더로 모바일 클라이언트로 감지");
            return false;
        }
        
        // User-Agent 기반 모바일 감지
        if (userAgent != null && isMobileUserAgent(userAgent)) {
            log.debug("User-Agent로 모바일 클라이언트로 감지");
            return false;
        }
        
        // 쿠키 기반 웹 감지 (쿠키가 있으면 웹으로 간주)
        if (hasRefreshTokenCookie) {
            log.debug("리프레시 토큰 쿠키 존재로 웹 클라이언트로 감지");
            return true;
        }
        
        // 기본값: 쿠키가 없으면 모바일로 간주
        log.debug("기본값으로 모바일 클라이언트로 감지");
        return false;
    }
    
    /**
     * 쿠키에서 refresh_token을 추출합니다.
     * 
     * @param request HTTP 요청 객체
     * @return 추출된 리프레시 토큰 JTI
     * @throws BaseException 토큰을 찾을 수 없는 경우
     */
    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        
        log.debug("요청된 쿠키 개수: {}", cookies != null ? cookies.length : 0);
        log.debug("요청 URL: {}", request.getRequestURL());
        log.debug("요청 도메인: {}", request.getServerName());
        log.debug("요청 포트: {}", request.getServerPort());
        log.debug("요청 스키마: {}", request.getScheme());
        
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                log.debug("쿠키 이름: {}, 값: {}, 도메인: {}, 경로: {}, 보안: {}, HttpOnly: {}", 
                    cookie.getName(), 
                    cookie.getValue(),
                    cookie.getDomain(),
                    cookie.getPath(),
                    cookie.getSecure(),
                    cookie.isHttpOnly());
                if ("refresh_token".equals(cookie.getName())) {
                    log.debug("쿠키에서 refresh_token 추출 완료");
                    return cookie.getValue();
                }
            }
        } else {
            log.debug("쿠키 배열이 null입니다");
        }
        
        log.warn("토큰 갱신 실패: 쿠키에서 refresh_token을 찾을 수 없음");
        throw new BaseException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
    }
    
    /**
     * 리프레시 토큰을 검증하고 회전시킨 후 새로운 액세스 토큰을 생성합니다.
     * 
     * @param refreshTokenJti 검증할 리프레시 토큰 JTI
     * @param response HTTP 응답 객체 (새로운 리프레시 토큰 쿠키 설정용)
     * @return 웹용 토큰 갱신 DTO
     * @throws BaseException 토큰이 유효하지 않은 경우
     */
    private WebTokenRefreshDto validateRefreshTokenAndCreateAccessToken(String refreshTokenJti, HttpServletResponse response) {
        try {
            // 리프레시 토큰 검증 및 회전
            var refreshCtx = refreshTokenService.validateAndRotate(refreshTokenJti);
            
            // 새로운 액세스 토큰 생성
            String newAccessToken = jwtUtil.createToken(refreshCtx.memberId(), refreshCtx.username());
            
            // 회전된 리프레시 토큰을 쿠키로 설정
            var refreshTokenCookie = org.springframework.http.ResponseCookie.from("refresh_token", refreshCtx.newJti())
                    .httpOnly(true)
                    .secure(true)
                    .sameSite("None")
                    .path("/")
                    .maxAge(java.time.Duration.ofSeconds(refreshCtx.newRtTtlSeconds()))
                    .build();
            
            response.addHeader("Set-Cookie", refreshTokenCookie.toString());
            
            log.info("웹 토큰 갱신 성공: 사용자 {} (ID: {}), 패밀리: {}, 만료시간: {}", 
                    refreshCtx.username(), refreshCtx.memberId(), refreshCtx.familyId(), refreshCtx.newRtExpiresEpochSec());
            
            return WebTokenRefreshDto.of(newAccessToken, refreshCtx.newJti());
            
        } catch (BaseException e) {
            // BaseException은 그대로 재抛出
            throw e;
        } catch (Exception e) {
            log.error("웹 토큰 갱신 실패: 리프레시 토큰 검증 중 오류 발생", e);
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }
    }
    
    /**
     * 모바일용 토큰 갱신 처리
     */
    private MobileTokenRefreshDto refreshTokenForMobile(HttpServletRequest request) {
        log.info("모바일 토큰 갱신 요청 처리 시작");
        
        // 요청 바디에서 refreshToken 추출
        String refreshToken = extractRefreshTokenFromBody(request);
        
        return mobileAuthService.refreshToken(refreshToken);
    }
    
    /**
     * 요청 바디에서 refreshToken을 추출합니다.
     */
    private String extractRefreshTokenFromBody(HttpServletRequest request) {
        String refreshToken = request.getParameter("refreshToken");
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            log.warn("모바일 토큰 갱신 실패: 요청 바디에서 refreshToken을 찾을 수 없음");
            throw new BaseException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }
        return refreshToken;
    }
    
    /**
     * User-Agent가 모바일인지 확인
     */
    private boolean isMobileUserAgent(String userAgent) {
        if (userAgent == null) return false;
        
        String lowerUserAgent = userAgent.toLowerCase();
        return lowerUserAgent.contains("mobile") || 
               lowerUserAgent.contains("android") || 
               lowerUserAgent.contains("iphone") || 
               lowerUserAgent.contains("ipad") || 
               lowerUserAgent.contains("ipod");
    }
    
    /**
     * 웹용 토큰 갱신 처리
     */
    private WebTokenRefreshDto refreshTokenForWeb(HttpServletRequest request, HttpServletResponse response) {
        log.info("웹 토큰 갱신 요청 처리 시작");
        
        // 쿠키에서 refresh_token 추출
        String refreshTokenJti = extractRefreshTokenFromCookie(request);
        
        // 리프레시 토큰 검증 및 회전, 새로운 액세스 토큰 생성
        return validateRefreshTokenAndCreateAccessToken(refreshTokenJti, response);
    }
    
    /**
     * 쿠키에 refresh_token이 있는지 확인합니다.
     */
    private boolean hasRefreshTokenCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refresh_token".equals(cookie.getName())) {
                    return true;
                }
            }
        }
        return false;
    }
}
