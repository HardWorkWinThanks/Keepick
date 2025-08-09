package com.ssafy.keepick.album.common.application;

import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.group.domain.Group;
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
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.verify;

@ExtendWith(MockitoExtension.class)
class AlbumServiceTest extends BaseTest {

    @InjectMocks
    AlbumService albumService;

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

        verify(timelineAlbumRepository).findAllByGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId);
        verify(tierAlbumRepository).findByGroupId(groupId);
        verify(highlightAlbumRepository).findAllByGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId);
    }

    private Photo createPhoto() {
        return Photo.createPhoto(null, null, null, null);
    }

}