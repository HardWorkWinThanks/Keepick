package com.ssafy.keepick.auth.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;

@Component
public class JWTUtil {

    private SecretKey key;
    private final long expiredMs;

    public JWTUtil(@Value("${jwt.secret}") String secret, @Value("${jwt.expiredMs}") long expiredMs) {
        // 키 생성, 키 알고리즘은 HS256
        this.key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), Jwts.SIG.HS256.key().build().getAlgorithm());
        this.expiredMs = expiredMs;
    }

    public String getUsername(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().get("username",
                String.class);
    }

    public Long getMemberId(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().get("memberId", Long.class);
    }

    public String getRole(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().get("role", String.class);
    }

    public Boolean isExpired(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getExpiration()
                .before(new Date());
    }

    public String createToken(Long memberId, String username) {
        return Jwts.builder()
                .claim("memberId", memberId)
                .claim("username", username)
                .claim("role", "ROLE_USER")
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiredMs))
                .signWith(key)
                .compact();
    }
}
