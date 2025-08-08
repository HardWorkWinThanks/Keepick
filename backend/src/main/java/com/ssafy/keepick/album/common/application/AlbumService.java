package com.ssafy.keepick.album.common.application;

import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.highlight.presistence.HighlightAlbumRepository;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlbumService {

    private final GroupRepository groupRepository;
    private final TimelineAlbumRepository timelineAlbumRepository;
    private final TierAlbumRepository tierAlbumRepository;
    private final HighlightAlbumRepository highlightAlbumRepository;

    public AlbumDto getAllAlbumList(Long groupId) {
        groupRepository.findById(groupId).orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));

        return AlbumDto.of(
                getAllTimelineAlbumList(groupId),
                getAllTierAlbumList(groupId),
                getAllHighlightAlbumList(groupId)
        );
    }

    private List<TimelineAlbumDto> getAllTimelineAlbumList(Long groupId) {
        return null;
    }

    private List<TierAlbumDto> getAllTierAlbumList(Long groupId) {
        return null;
    }

    private List<HighlightAlbumDto> getAllHighlightAlbumList(Long groupId) {
        return null;
    }

}
