package com.ssafy.keepick.global.interceptor;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.support.BaseTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupMemberInterceptorTest extends BaseTest {

    @InjectMocks
    private GroupMemberInterceptor interceptor;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private MockHttpServletRequest request;

    @Mock
    private MockHttpServletResponse response;

    @Mock
    private Object handler;

    @BeforeEach
    void setup() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        handler = new Object();
    }

    @DisplayName("그룹에 가입한 회원이면 성공한다.")
    @Test
    void success() throws Exception {
        // given
        try (MockedStatic<AuthenticationUtil> mocked = mockStatic(AuthenticationUtil.class)) {
            Long currentUserId = 1L;
            Long groupId = 100L;

            mocked.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);

            request.setRequestURI("/api/groups/100");

            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                    .thenReturn(true);

            // when
            boolean result = interceptor.preHandle(request, response, handler);

            // then
            assertThat(result).isTrue();
            verify(groupMemberRepository).existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED);
        }
    }

    @DisplayName("그룹에 가입한 회원이 아니면 예외가 발생한다.")
    @Test
    void fail() {
        // given
        try (MockedStatic<AuthenticationUtil> mocked = mockStatic(AuthenticationUtil.class)) {
            Long currentUserId = 1L;
            Long groupId = 100L;

            mocked.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);

            request.setRequestURI("/api/groups/100");

            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                    .thenReturn(false);

            // when & then
            assertThatThrownBy(() -> interceptor.preHandle(request, response, handler))
                    .isInstanceOf(BaseException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
        }
    }

}
