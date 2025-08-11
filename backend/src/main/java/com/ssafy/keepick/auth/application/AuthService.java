package com.ssafy.keepick.auth.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.keepick.auth.application.dto.WebTokenRefreshDto;
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
    
    /**
     * 웹용 토큰 갱신 처리
     * 쿠키에서 refresh_token을 추출하고 새로운 액세스 토큰을 발급합니다.
     * 
     * @param request HTTP 요청 객체
     * @param response HTTP 응답 객체 (새로운 리프레시 토큰 쿠키 설정용)
     * @return 웹용 토큰 갱신 DTO
     * @throws BaseException 토큰이 없거나 유효하지 않은 경우
     */
    public WebTokenRefreshDto refreshToken(HttpServletRequest request, HttpServletResponse response) {
        log.info("웹 토큰 갱신 요청 처리 시작");
        
        // 쿠키에서 refresh_token 추출
        String refreshTokenJti = extractRefreshTokenFromCookie(request);
        
        // 리프레시 토큰 검증 및 회전, 새로운 액세스 토큰 생성
        return validateRefreshTokenAndCreateAccessToken(refreshTokenJti, response);
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
}
