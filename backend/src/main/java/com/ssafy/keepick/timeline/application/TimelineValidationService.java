package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TimelineValidationService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final TimelineAlbumRepository timelineAlbumRepository;

    public void validateGroupMemberPermission(Long groupId) {
        groupRepository.findById(groupId).orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));

        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        System.out.println("currentUserId = " + currentUserId);

        if (!groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
    }

    public void validateAlbumBelongsToGroup(Long groupId, Long albumId) {
        if (!timelineAlbumRepository.existsByIdAndGroupIdAndDeletedAtIsNull(albumId, groupId)) {
            throw new BaseException(ErrorCode.ALBUM_NOT_FOUND);
        }
    }

    public void validateAlbumPermission(Long groupId, Long albumId) {
        validateGroupMemberPermission(groupId);
        validateAlbumBelongsToGroup(groupId, albumId);
    }

}
