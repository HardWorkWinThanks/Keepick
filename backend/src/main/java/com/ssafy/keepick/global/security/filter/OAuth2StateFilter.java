package com.ssafy.keepick.global.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * OAuth2 인증 시작 요청에 state 파라미터를 추가하는 필터
 * 프론트엔드 Origin을 state 파라미터에 포함시켜 콜백에서 복원할 수 있도록 함
 */
@Slf4j
@Component
public class OAuth2StateFilter extends OncePerRequestFilter {

    @Value("#{'${app.redirect.allowed}'.split('\\s*,\\s*')}")
    private List<String> allowedOrigins;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        String uri = req.getRequestURI();
        String method = req.getMethod();
        String clientIp = getClientIp(req);

        log.info("🔍 OAuth2StateFilter 요청 감지 - 누가: 시스템 | 언제: {} | 어디서: {} | 무엇을: {} {} | 어떻게: 필터 체크 | 왜: OAuth2 인증 요청 확인",
                java.time.LocalDateTime.now(), clientIp, method, uri);

        // 시작 경로만 대상
        boolean isAuthStart = "GET".equals(method) && 
                (uri.startsWith("/api/oauth2/authorization/") || uri.startsWith("/oauth2/authorization/"));

        // 콜백 경로면 패스
        if (uri.startsWith("/login/oauth2/code/") || uri.startsWith("/api/login/oauth2/code/")) {
            log.info("🔄 OAuth2 콜백 경로 감지 - 패스: {}", uri);
            chain.doFilter(req, res);
            return;
        }

        // 시작이 아니거나 state 이미 있으면 패스(루프 방지)
        if (!isAuthStart || req.getParameter("state") != null) {
            if (!isAuthStart) {
                log.info("ℹ️ OAuth2 인증 시작 경로 아님 - 패스: {}", uri);
            } else {
                log.info("ℹ️ state 파라미터 이미 존재 - 패스: {}", uri);
            }
            chain.doFilter(req, res);
            return;
        }

        log.info("✅ OAuth2 인증 시작 요청 확인 - 누가: 시스템 | 언제: {} | 어디서: {} | 무엇을: {} | 어떻게: 경로 매칭 | 왜: state 파라미터 추가 준비",
                java.time.LocalDateTime.now(), clientIp, uri);

        // 모든 헤더 로깅
        log.info("📋 요청 헤더 정보 - Origin: {}, Referer: {}, X-Forwarded-Proto: {}, X-Forwarded-Host: {}, User-Agent: {}",
                req.getHeader("Origin"),
                req.getHeader("Referer"),
                req.getHeader("X-Forwarded-Proto"),
                req.getHeader("X-Forwarded-Host"),
                req.getHeader("User-Agent"));

        // Origin 추출
        String origin = extractOrigin(req);
        String norm = normalize(origin);

        // 화이트리스트 매칭
        boolean allowed = isAllowed(norm);

        // state 생성: allowed일 때만 origin 포함
        String state = buildState(allowed ? norm : null);

        // 기존 쿼리에 state 추가
        String qs = req.getQueryString();
        String newQs = (qs == null || qs.isBlank())
                ? "state=" + URLEncoder.encode(state, StandardCharsets.UTF_8)
                : qs + "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8);

        // 프록시 안전하게 "상대 경로"로 리다이렉트
        String newUrl = UriComponentsBuilder.fromPath(uri).query(newQs).build().toUriString();

        log.info("🔧 OAuth2 state 파라미터 추가 - 누가: 시스템 | 언제: {} | 어디서: {} | 무엇을: {} → {} | 어떻게: Origin을 state에 포함 | 왜: 콜백에서 원본 Origin 복원",
                java.time.LocalDateTime.now(), norm != null ? norm : "허용되지 않은 Origin", uri, newUrl);

        res.sendRedirect(newUrl);
    }

    /** 요청에서 Origin 추출 */
    private String extractOrigin(HttpServletRequest request) {
        // Origin 헤더 우선 확인
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            log.info("🔍 Origin 헤더에서 추출: {}", origin);
            return origin.trim();
        }

        // Referer 헤더에서 추출
        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isBlank()) {
            try {
                java.net.URI uri = java.net.URI.create(referer);
                if (uri.getScheme() != null && uri.getHost() != null) {
                    String base = uri.getScheme() + "://" + uri.getHost() + (uri.getPort() == -1 ? "" : ":" + uri.getPort());
                    log.info("🔍 Referer에서 Origin 추출: {} → {}", referer, base);
                    return base;
                }
            } catch (Exception e) {
                log.warn("🚫 Referer 파싱 실패: {}", referer, e);
            }
        }

        // X-Forwarded 헤더 확인
        String xfProto = request.getHeader("X-Forwarded-Proto");
        String xfHost = request.getHeader("X-Forwarded-Host");
        if (xfProto != null && xfHost != null) {
            String base = xfProto + "://" + xfHost;
            log.info("🔍 X-Forwarded 헤더에서 Origin 추출: {}://{}", xfProto, xfHost);
            return base;
        }

        log.warn("🚫 Origin 추출 실패 - 모든 헤더 확인 불가");
        return null;
    }

    /** 화이트리스트 매칭 */
    private boolean isAllowed(String origin) {
        if (origin == null) return false;
        
        boolean allowed = allowedOrigins.stream()
                .map(this::normalize)
                .anyMatch(allow -> allow.equalsIgnoreCase(origin));
        
        if (allowed) {
            log.info("✅ 허용된 Origin 확인: {}", origin);
        } else {
            log.warn("🚫 차단된 Origin 감지: {}", origin);
        }
        
        return allowed;
    }

    /** state 생성 */
    private String buildState(String origin) {
        if (origin != null) {
            return "origin=" + origin;
        } else {
            return "origin=default";
        }
    }

    /** 끝의 슬래시 제거 */
    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.endsWith("/")) t = t.substring(0, t.length() - 1);
        return t;
    }

    /** 클라이언트 IP 주소 추출 (프록시 환경 고려) */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
