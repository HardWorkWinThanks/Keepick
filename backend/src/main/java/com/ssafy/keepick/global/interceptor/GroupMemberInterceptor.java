package com.ssafy.keepick.global.interceptor;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.persistence.GroupRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class GroupMemberInterceptor implements HandlerInterceptor {

    private final GroupMemberRepository groupMemberRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 로그인 유저와 그룹 ID 조회
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        Long groupId = extractGroupIdFromPath(request.getRequestURI());

        // 유저가 그룹에 가입한 회원인지 확인
        boolean isGroupMember = groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED);
        if(!isGroupMember) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        return true;
    }

    private Long extractGroupIdFromPath(String path) {
        Pattern pattern = Pattern.compile("/api/groups/(\\d+)(/.*)?");
        Matcher matcher = pattern.matcher(path);
        if (matcher.find()) {
            return Long.parseLong(matcher.group(1));
        }
        return null;
    }

}
