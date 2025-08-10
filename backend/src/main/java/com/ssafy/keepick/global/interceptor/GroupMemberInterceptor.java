package com.ssafy.keepick.global.interceptor;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class GroupMemberInterceptor implements HandlerInterceptor {

    private final GroupMemberRepository groupMemberRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        log.info("[GroupMemberInterceptor] 요청 처리 시작 - URI: {}, Method: {}", requestURI, method);
        
        // 로그인 유저와 그룹 ID 조회
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        log.info("[GroupMemberInterceptor] 현재 인증된 사용자 ID: {}", currentUserId);
        
        Long groupId = extractGroupIdFromPath(requestURI);
        if (groupId == null) {
            log.warn("[GroupMemberInterceptor] URI에서 그룹 ID를 추출할 수 없음 - URI: {}", requestURI);
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }
        log.info("[GroupMemberInterceptor] 추출된 그룹 ID: {}", groupId);

        // 유저가 그룹에 가입한 회원인지 확인
        log.debug("[GroupMemberInterceptor] 그룹 멤버십 확인 - GroupId: {}, UserId: {}", groupId, currentUserId);
        boolean isGroupMember = groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED);
        log.debug("[GroupMemberInterceptor] 그룹 멤버십 확인 결과: {}", isGroupMember);
        
        if(!isGroupMember) {
            log.warn("[GroupMemberInterceptor] 사용자가 그룹 멤버가 아님 - GroupId: {}, UserId: {}", groupId, currentUserId);
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        
        log.info("[GroupMemberInterceptor] 그룹 멤버 검증 성공 - GroupId: {}, UserId: {}", groupId, currentUserId);
        return true;
    }

    private Long extractGroupIdFromPath(String path) {
        log.debug("[GroupMemberInterceptor] 경로에서 그룹 ID 추출 - Path: {}", path);
        Pattern pattern = Pattern.compile("/api/groups/(\\d+)(/.*)?");
        Matcher matcher = pattern.matcher(path);
        if (matcher.find()) {
            Long groupId = Long.parseLong(matcher.group(1));
            log.debug("[GroupMemberInterceptor] 그룹 ID 추출 성공: {}", groupId);
            return groupId;
        }
        log.debug("[GroupMemberInterceptor] 그룹 ID 추출 실패");
        return null;
    }

}
