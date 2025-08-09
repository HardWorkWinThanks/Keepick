package com.ssafy.keepick.album.common.application;

import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.highlight.domain.HighlightAlbum;
import com.ssafy.keepick.highlight.presistence.HighlightAlbumRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.support.BaseTest;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class AlbumServiceTest extends BaseTest {

    @InjectMocks
    AlbumService albumService;

    @Mock
    GroupRepository groupRepository;

    @Mock
    GroupMemberRepository groupMemberRepository;

    @Mock
    TimelineAlbumRepository timelineAlbumRepository;

    @Mock
    TierAlbumRepository tierAlbumRepository;

    @Mock
    HighlightAlbumRepository highlightAlbumRepository;

    Long groupId = 1L;
    Long currentUserId = 1L;

    @DisplayName("타임라인, 티어, 하이라이트 앨범을 조회한다.")
    @Test
    void getAllAlbumList() {
        // given
        Group group = Group.createGroup("TEST", null);
        given(groupRepository.findById(groupId)).willReturn(Optional.of(group));
        given(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(eq(groupId), eq(currentUserId), eq(GroupMemberStatus.ACCEPTED))).willReturn(true);

        try (MockedStatic<AuthenticationUtil> mockedStatic = Mockito.mockStatic(AuthenticationUtil.class)) {
            mockedStatic.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            given(AuthenticationUtil.getCurrentUserId()).willReturn(currentUserId);

            TimelineAlbum timelineAlbum = TimelineAlbum.createTimelineAlbum(group, List.of(createPhoto()));
            TierAlbum tierAlbum = TierAlbum.createTierAlbum(groupId);
            HighlightAlbum highlightAlbum = HighlightAlbum.builder().group(group).build();

            given(timelineAlbumRepository.findAllByGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId)).willReturn(List.of(timelineAlbum));
            given(tierAlbumRepository.findByGroupId(groupId)).willReturn(List.of(tierAlbum));
            given(highlightAlbumRepository.findAllByGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId)).willReturn(List.of(highlightAlbum));

            // when
            AlbumDto albumDto = albumService.getAllAlbumList(groupId);

            // then
            assertThat(albumDto.getTimelineAlbumDtoList()).hasSize(1);
            assertThat(albumDto.getTierAlbumDtoList()).hasSize(1);
            assertThat(albumDto.getHighlightAlbumDtoList()).hasSize(1);

            verify(groupRepository).findById(groupId);
            verify(groupMemberRepository).existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED);
            verify(timelineAlbumRepository).findAllByGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId);
            verify(tierAlbumRepository).findByGroupId(groupId);
            verify(highlightAlbumRepository).findAllByGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId);        }
    }
    
    @DisplayName("그룹이 존재하지 않으면 예외가 발생한다.")
    @Test
    void getAllAlbumListWithNoGroup() {
        // given
        given(groupRepository.findById(groupId)).willReturn(Optional.empty());

        // when & then
        assertThrows(BaseException.class, () -> albumService.getAllAlbumList(groupId));
    }

    private Photo createPhoto() {
        return Photo.createPhoto(null, null, null, null);
    }

}