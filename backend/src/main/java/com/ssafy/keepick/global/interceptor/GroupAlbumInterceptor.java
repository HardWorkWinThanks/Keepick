package com.ssafy.keepick.global.interceptor;

import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.highlight.presistence.HighlightAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class GroupAlbumInterceptor implements HandlerInterceptor {

    private final Pattern pattern = Pattern.compile("^/api/groups/(\\d+)/(\\w+)-albums/(\\d+)$");

    private final TimelineAlbumRepository timelineAlbumRepository;
    private final TierAlbumRepository tierAlbumRepository;
    private final HighlightAlbumRepository highlightAlbumRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI();
        Matcher matcher = pattern.matcher(requestURI);
        if (!matcher.find()) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }

        Long groupId = Long.parseLong(matcher.group(1));
        String albumType = matcher.group(2);
        Long albumId = Long.parseLong(matcher.group(3));

        boolean isGroupAlbum = switch (albumType) {
            case "timeline" -> validateTimelineAlbumBelongsToGroup(albumId, groupId);
            case "tier" -> validateTierAlbumBelongsToGroup(albumId, groupId);
            case "highlight" -> validateHighlightAlbumBelongsToGroup(albumId, groupId);
            default -> throw new BaseException(ErrorCode.INVALID_PARAMETER);
        };

        // 그룹에 앨범이 없는 경우 예외 발생
        if (!isGroupAlbum) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        return true;
    }

    private boolean validateTimelineAlbumBelongsToGroup(Long albumId, Long groupId) {
        return timelineAlbumRepository.existsByIdAndGroupIdAndDeletedAtIsNull(albumId, groupId);
    }

    private boolean validateTierAlbumBelongsToGroup(Long albumId, Long groupId) {
        return tierAlbumRepository.existsByIdAndGroupIdAndDeletedAtIsNull(albumId, groupId);
    }

    private boolean validateHighlightAlbumBelongsToGroup(Long albumId, Long groupId) {
        return highlightAlbumRepository.existsByIdAndGroupIdAndDeletedAtIsNull(albumId, groupId);
    }

}
