package com.ssafy.keepick.global.interceptor;

import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.highlight.presistence.HighlightAlbumRepository;
import com.ssafy.keepick.support.BaseTest;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupAlbumInterceptorTest extends BaseTest {

    @InjectMocks
    private GroupAlbumInterceptor interceptor;

    @Mock
    private TimelineAlbumRepository timelineAlbumRepository;

    @Mock
    private TierAlbumRepository tierAlbumRepository;

    @Mock
    private HighlightAlbumRepository highlightAlbumRepository;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private Object handler;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        handler = new Object();
    }

    @DisplayName("그룹에 앨범이 존재하면 성공한다.")
    @Test
    void success() throws Exception {
        // given
        request.setRequestURI("/api/groups/100/timeline-albums/200");
        when(timelineAlbumRepository.existsByIdAndGroupIdAndDeletedAtIsNull(200L, 100L))
                .thenReturn(true);

        // when
        boolean result = interceptor.preHandle(request, response, handler);

        // then
        assertThat(result).isTrue();
    }

    @DisplayName("그룹에 앨범이 없으면 예외가 발생한다.")
    @Test
    void fail() {
        // given
        request.setRequestURI("/api/groups/100/tier-albums/200");
        when(tierAlbumRepository.existsByIdAndGroupIdAndDeletedAtIsNull(200L, 100L))
                .thenReturn(false);

        // when & then
        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
    }

    @DisplayName("잘못된 URI 경로이면 예외가 발생한다.")
    @Test
    void invalidURI() {
        // given
        request.setRequestURI("/api/groups/100/invalid-albums/200");

        // when & then
        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PARAMETER);
    }
}
