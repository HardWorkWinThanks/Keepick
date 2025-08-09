package com.ssafy.keepick.album.common.application;

import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.highlight.domain.HighlightAlbum;
import com.ssafy.keepick.highlight.presistence.HighlightAlbumRepository;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
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
    private final GroupMemberRepository groupMemberRepository;

    private final TimelineAlbumRepository timelineAlbumRepository;
    private final TierAlbumRepository tierAlbumRepository;
    private final HighlightAlbumRepository highlightAlbumRepository;

    public AlbumDto getAllAlbumList(Long groupId) {
        return AlbumDto.of(
                getAllTimelineAlbumList(groupId),
                getAllTierAlbumList(groupId),
                getAllHighlightAlbumList(groupId)
        );
    }

    private List<TimelineAlbumDto> getAllTimelineAlbumList(Long groupId) {
        List<TimelineAlbum> timelineAlbumList = timelineAlbumRepository.findAllByGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId);
        return timelineAlbumList.stream().map(TimelineAlbumDto::from).toList();
    }

    private List<TierAlbumDto> getAllTierAlbumList(Long groupId) {
        List<TierAlbum> tierAlbumList = tierAlbumRepository.findByGroupId(groupId);
        return tierAlbumList.stream().map(TierAlbumDto::from).toList();
    }

    private List<HighlightAlbumDto> getAllHighlightAlbumList(Long groupId) {
        List<HighlightAlbum> highlightAlbumList = highlightAlbumRepository.findAllByGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId);
        return highlightAlbumList.stream().map(HighlightAlbumDto::from).toList();
    }

}
