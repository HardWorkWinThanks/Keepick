package com.ssafy.keepick.global.interceptor;

import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.highlight.presistence.HighlightAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
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
        String method = request.getMethod();
        
        log.info("[GroupAlbumInterceptor] 요청 처리 시작 - URI: {}, Method: {}", requestURI, method);
        
        Matcher matcher = pattern.matcher(requestURI);
        if (!matcher.find()) {
            log.warn("[GroupAlbumInterceptor] URI 패턴이 일치하지 않음 - URI: {}", requestURI);
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }

        Long groupId = Long.parseLong(matcher.group(1));
        String albumType = matcher.group(2);
        Long albumId = Long.parseLong(matcher.group(3));
        
        log.info("[GroupAlbumInterceptor] 파싱된 정보 - GroupId: {}, AlbumType: {}, AlbumId: {}", groupId, albumType, albumId);

        boolean isGroupAlbum = switch (albumType) {
            case "timeline" -> validateTimelineAlbumBelongsToGroup(albumId, groupId);
            case "tier" -> validateTierAlbumBelongsToGroup(albumId, groupId);
            case "highlight" -> validateHighlightAlbumBelongsToGroup(albumId, groupId);
            default -> {
                log.warn("[GroupAlbumInterceptor] 지원하지 않는 앨범 타입: {}", albumType);
                throw new BaseException(ErrorCode.INVALID_PARAMETER);
            }
        };

        // 그룹에 앨범이 없는 경우 예외 발생
        if (!isGroupAlbum) {
            log.warn("[GroupAlbumInterceptor] 앨범이 그룹에 속하지 않음 - GroupId: {}, AlbumType: {}, AlbumId: {}", groupId, albumType, albumId);
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        
        log.info("[GroupAlbumInterceptor] 앨범 검증 성공 - GroupId: {}, AlbumType: {}, AlbumId: {}", groupId, albumType, albumId);
        return true;
    }

    private boolean validateTimelineAlbumBelongsToGroup(Long albumId, Long groupId) {
        log.debug("[GroupAlbumInterceptor] Timeline 앨범 검증 - AlbumId: {}, GroupId: {}", albumId, groupId);
        boolean exists = timelineAlbumRepository.existsByIdAndGroupIdAndDeletedAtIsNull(albumId, groupId);
        log.debug("[GroupAlbumInterceptor] Timeline 앨범 검증 결과: {}", exists);
        return exists;
    }

    private boolean validateTierAlbumBelongsToGroup(Long albumId, Long groupId) {
        log.debug("[GroupAlbumInterceptor] Tier 앨범 검증 - AlbumId: {}, GroupId: {}", albumId, groupId);
        boolean exists = tierAlbumRepository.existsByIdAndGroupIdAndDeletedAtIsNull(albumId, groupId);
        log.debug("[GroupAlbumInterceptor] Tier 앨범 검증 결과: {}", exists);
        return exists;
    }

    private boolean validateHighlightAlbumBelongsToGroup(Long albumId, Long groupId) {
        log.debug("[GroupAlbumInterceptor] Highlight 앨범 검증 - AlbumId: {}, GroupId: {}", albumId, groupId);
        boolean exists = highlightAlbumRepository.existsByIdAndGroupIdAndDeletedAtIsNull(albumId, groupId);
        log.debug("[GroupAlbumInterceptor] Highlight 앨범 검증 결과: {}", exists);
        return exists;
    }

}
