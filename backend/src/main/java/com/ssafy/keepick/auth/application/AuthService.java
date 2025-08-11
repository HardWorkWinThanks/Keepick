package com.ssafy.keepick.auth.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.keepick.auth.controller.response.TokenRefreshResponse;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.JWTUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
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
     * 쿠키에서 access_token을 추출하고 새로운 토큰을 발급합니다.
     * 
     * @param request HTTP 요청 객체
     * @return 새로운 액세스 토큰이 포함된 응답
     * @throws BaseException 토큰이 없거나 유효하지 않은 경우
     */
    public TokenRefreshResponse refreshToken(HttpServletRequest request) {
        log.info("토큰 갱신 요청 처리 시작");
        
        // 쿠키에서 access_token 추출
        String accessToken = extractTokenFromCookie(request);
        
        // 토큰 유효성 검증 및 새로운 토큰 생성
        return validateAndCreateNewToken(accessToken);
    }
    
    /**
     * 쿠키에서 access_token을 추출합니다.
     * 
     * @param request HTTP 요청 객체
     * @return 추출된 액세스 토큰
     * @throws BaseException 토큰을 찾을 수 없는 경우
     */
    private String extractTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("access_token".equals(cookie.getName())) {
                    log.debug("쿠키에서 access_token 추출 완료");
                    return cookie.getValue();
                }
            }
        }
        
        log.warn("토큰 갱신 실패: 쿠키에서 access_token을 찾을 수 없음");
        throw new BaseException(ErrorCode.UNAUTHORIZED);
    }
    
    /**
     * 토큰의 유효성을 검증하고 새로운 토큰을 생성합니다.
     * 
     * @param accessToken 검증할 액세스 토큰
     * @return 새로운 액세스 토큰이 포함된 응답
     * @throws BaseException 토큰이 유효하지 않은 경우
     */
    private TokenRefreshResponse validateAndCreateNewToken(String accessToken) {
        try {
            // 토큰 만료 여부 확인
            if (jwtUtil.isExpired(accessToken)) {
                log.warn("토큰 갱신 실패: 토큰이 만료됨");
                throw new BaseException(ErrorCode.UNAUTHORIZED);
            }
            
            // 토큰에서 사용자 정보 추출
            Long memberId = jwtUtil.getMemberId(accessToken);
            String username = jwtUtil.getUsername(accessToken);
            
            // 새로운 토큰 생성
            String newToken = jwtUtil.createToken(memberId, username);
            
            log.info("토큰 갱신 성공: 사용자 {} (ID: {})", username, memberId);
            
            return TokenRefreshResponse.of(newToken);
            
        } catch (BaseException e) {
            // BaseException은 그대로 재抛出
            throw e;
        } catch (Exception e) {
            log.error("토큰 갱신 실패: 토큰 검증 중 오류 발생", e);
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }
    }
}
