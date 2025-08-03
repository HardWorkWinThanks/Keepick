package com.ssafy.keepick.global.security.filter;

import java.io.IOException;

import com.ssafy.keepick.global.security.util.JWTUtil;
import com.ssafy.keepick.global.response.ResponseCode;
import com.ssafy.keepick.global.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.ssafy.keepick.auth.application.dto.CustomOAuth2Member;
import com.ssafy.keepick.auth.application.dto.MemberDto;

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

        // Authorization 헤더 가져오기
        String authorization = request.getHeader("Authorization");

        // Authorization 헤더 검증
        if (authorization == null || !authorization.startsWith("Bearer ")) {    
            log.info("Authorization 헤더가 없거나 유효하지 않습니다.");
            sendErrorResponse(response, ResponseCode.UNAUTHORIZED);
            return;
        }

        // 토큰
        String token = authorization.split(" ")[1];

        Long memberId;
        String username;
        String role;

        try {
            // 토큰 소멸 시간 검증
            if (jwtUtil.isExpired(token)) {
                log.info("토큰이 만료되었습니다.");
                sendErrorResponse(response, ResponseCode.UNAUTHORIZED);
                return;
            }

            memberId = jwtUtil.getMemberId(token);
            username = jwtUtil.getUsername(token);
            role = jwtUtil.getRole(token);
        } catch (Exception e) {
            log.info("유효하지 않은 토큰입니다: {}", e.getMessage());
            sendErrorResponse(response, ResponseCode.UNAUTHORIZED);
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

        filterChain.doFilter(request, response);
    }

    private void sendErrorResponse(HttpServletResponse response, ResponseCode code) throws IOException {
        response.setStatus(code.getStatus());
        response.setContentType("application/json;charset=UTF-8");
        
        ApiResponse<Object> apiResponse = ApiResponse.of(code);
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonResponse = objectMapper.writeValueAsString(apiResponse);
        
        response.getWriter().write(jsonResponse);
    }
}
