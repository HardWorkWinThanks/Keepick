package com.ssafy.keepick.global.security.filter;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.ssafy.keepick.auth.application.dto.CustomOAuth2Member;
import com.ssafy.keepick.auth.application.dto.MemberDto;
import com.ssafy.keepick.global.security.util.JWTUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@AllArgsConstructor
@Slf4j
public class JWTFilter extends OncePerRequestFilter {
    private final JWTUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        if (uri.startsWith("/api/oauth2/authorization")
                || uri.startsWith("/api/login/oauth2/code")
                || uri.equals("/api/auth/login")
                || uri.equals("/.well-known/assetlinks.json")
                || uri.startsWith("/api/groups/") && uri.contains("/photos/analysis/status/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        String userAgent = request.getHeader("User-Agent");

        // 요청 시작 로그
        log.info("🔐 JWT Filter - 요청 시작: {} {} | User-Agent: {}", method, requestURI, userAgent);

        // Authorization 헤더 가져오기
        String authorization = request.getHeader("Authorization");

        // Authorization 헤더 검증
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            // 인증이 필요한 경로에서만 경고 로그 출력
            if (isProtectedPath(requestURI)) {
                log.warn("⚠️ 인증 필요 경로 접근 - Authorization 헤더 없음: {} {}", method, requestURI);
            } else {
                log.debug("🔓 공개 경로 접근 - Authorization 헤더 없음: {} {}", method, requestURI);
            }
            
            log.debug("🔄 JWT Filter - 다음 필터로 요청 전달: {} {}", method, requestURI);
            filterChain.doFilter(request, response);
            log.debug("🏁 JWT Filter - 다음 필터 처리 완료: {} {}", method, requestURI);
            return;
        }

        // 토큰
        String token = authorization.split(" ")[1];
        log.debug("🔑 JWT 토큰 검증 시작: {} {}", method, requestURI);

        Long memberId;
        String username;
        String role;

        try {
            // 토큰 소멸 시간 검증
            if (jwtUtil.isExpired(token)) {
                log.warn("⏰ 토큰 만료: {} {} | 토큰: {}", method, requestURI,
                        token.substring(0, Math.min(20, token.length())) + "...");
                log.debug("🔄 JWT Filter - 토큰 만료로 다음 필터로 요청 전달: {} {}", method, requestURI);
                filterChain.doFilter(request, response);
                log.debug("🏁 JWT Filter - 토큰 만료 후 다음 필터 처리 완료: {} {}", method, requestURI);
                return;
            }

            memberId = jwtUtil.getMemberId(token);
            username = jwtUtil.getUsername(token);
            role = jwtUtil.getRole(token);

            log.debug("✅ 토큰 검증 성공: {} {} | 사용자: {} (ID: {})", method, requestURI, username, memberId);

        } catch (Exception e) {
            log.warn("❌ 토큰 검증 실패: {} {} | 에러: {}", method, requestURI, e.getMessage());
            log.debug("🔄 JWT Filter - 토큰 검증 실패로 다음 필터로 요청 전달: {} {}", method, requestURI);
            filterChain.doFilter(request, response);
            log.debug("🏁 JWT Filter - 토큰 검증 실패 후 다음 필터 처리 완료: {} {}", method, requestURI);
            return;
        }

        // userDTO를 생성하여 값 set
        MemberDto memberDto = MemberDto.of(memberId, username, role);

        // UserDetails에 회원 정보 객체 담기
        CustomOAuth2Member customOAuth2User = CustomOAuth2Member.from(memberDto);

        // 스프링 시큐리티 인증 토큰 생성
        Authentication authToken = new UsernamePasswordAuthenticationToken(customOAuth2User, null,
                customOAuth2User.getAuthorities());
        // 세션에 사용자 등록
        SecurityContextHolder.getContext().setAuthentication(authToken);

        log.info("🎉 인증 완료: {} {} | 사용자: {} (ID: {})", method, requestURI, username, memberId);

        log.debug("🔄 JWT Filter - 인증 완료 후 다음 필터로 요청 전달: {} {}", method, requestURI);
        filterChain.doFilter(request, response);

        // 응답 완료 로그
        log.debug("🏁 JWT Filter - 요청 완료: {} {} | 상태: {}", method, requestURI, response.getStatus());
    }

    /**
     * 인증이 필요한 보호된 경로인지 확인
     */
    private boolean isProtectedPath(String requestURI) {
        return requestURI.startsWith("/api/members") ||
                requestURI.startsWith("/api/groups");
    }
}
