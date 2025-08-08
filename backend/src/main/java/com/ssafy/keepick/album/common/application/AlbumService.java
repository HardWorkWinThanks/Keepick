package com.ssafy.keepick.album.common.application;

import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
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
        validateGroupMember(groupId);

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

    private void validateGroupMember(Long groupId) {
        // 그룹 검증
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));

        // 그룹에 가입한 회원인지 검증
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        if(!groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
    }

}
