package com.ssafy.keepick.global.security.resolver;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Base64;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * OAuth2 인증 요청에서 Origin을 state에 포함시키는 커스텀 Resolver
 * Spring Security의 기본 state 생성 로직을 확장하여 Origin 정보를 포함
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OriginAwareAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final ClientRegistrationRepository clientRegistrationRepository;

    @Value("#{'${app.redirect.allowed}'.split('\\s*,\\s*')}")
    private List<String> allowedOrigins;

    @Value("${app.security.stateSecret:keepick-state-secret-key}")
    private String stateSecret;

    private final String baseUri = "/api/oauth2/authorization";
    private OAuth2AuthorizationRequestResolver delegate;

    @PostConstruct
    void init() {
        // 기본 Resolver
        DefaultOAuth2AuthorizationRequestResolver defaultResolver =
                new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, baseUri);
        this.delegate = defaultResolver;
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = delegate.resolve(request);
        return mutate(req, request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = delegate.resolve(request, clientRegistrationId);
        return mutate(req, request);
    }

    private OAuth2AuthorizationRequest mutate(OAuth2AuthorizationRequest req, HttpServletRequest request) {
        if (req == null) return null;

        log.info("🔧 OriginAwareAuthorizationRequestResolver - 누가: 시스템 | 언제: {} | 어디서: {} | 무엇을: {} | 어떻게: state 변조 | 왜: Origin 정보 포함",
                java.time.LocalDateTime.now(), getClientIp(request), request.getRequestURI());

        // 1) 시작 지점에서 origin 추출 + 화이트리스트
        String origin = extractOrigin(request);
        String norm = normalize(origin);
        boolean allowed = isAllowed(norm);

        log.info("📋 Origin 추출 결과 - Origin: {}, 정규화: {}, 허용: {}", origin, norm, allowed);

        // 2) 기존 state (Spring이 만든 랜덤) 확보
        String baseState = req.getState();

        // 3) 우리가 원하는 형태로 합성 (예: base64url(payload).hmac)
        String payloadJson = buildPayloadJson(baseState, allowed ? norm : null);
        String encoded = base64Url(payloadJson.getBytes(StandardCharsets.UTF_8));
        String sig = hmacSha256B64Url(encoded, stateSecret);
        String customState = encoded + "." + sig;

        log.info("🔧 State 변조 - 기존: {} → 커스텀: {} (길이: {})", baseState, customState, customState.length());

        // 4) state 교체
        return OAuth2AuthorizationRequest.from(req)
                .state(customState)
                .build();
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

    /** 끝의 슬래시 제거 */
    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.endsWith("/")) t = t.substring(0, t.length() - 1);
        return t;
    }

    /** Base64 URL 인코딩 */
    private String base64Url(byte[] b) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    /** HMAC-SHA256 서명 (Base64 URL 인코딩) */
    private String hmacSha256B64Url(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return base64Url(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            log.error("🚫 HMAC 서명 생성 실패", e);
            throw new RuntimeException(e);
        }
    }

    /** Payload JSON 생성 */
    private String buildPayloadJson(String nonce, String origin) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            if (origin != null) {
                return mapper.writeValueAsString(new StatePayload(nonce, System.currentTimeMillis(), origin));
            } else {
                return mapper.writeValueAsString(new StatePayload(nonce, System.currentTimeMillis(), null));
            }
        } catch (Exception e) {
            log.error("🚫 Payload JSON 생성 실패", e);
            // 폴백: 간단한 문자열 조립
            if (origin != null) {
                return "{\"nonce\":\"" + nonce + "\",\"ts\":" + System.currentTimeMillis() + ",\"origin\":\"" + origin + "\"}";
            }
            return "{\"nonce\":\"" + nonce + "\",\"ts\":" + System.currentTimeMillis() + "}";
        }
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

    /** State Payload 내부 클래스 */
    private static class StatePayload {
        private final String nonce;
        private final long ts;
        private final String origin;

        public StatePayload(String nonce, long ts, String origin) {
            this.nonce = nonce;
            this.ts = ts;
            this.origin = origin;
        }

        public String getNonce() { return nonce; }
        public long getTs() { return ts; }
        public String getOrigin() { return origin; }
    }
}
