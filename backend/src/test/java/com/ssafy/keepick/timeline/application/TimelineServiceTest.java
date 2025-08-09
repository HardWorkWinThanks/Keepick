package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.support.BaseRepositoryTest;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumSectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.anyLong;
import static org.mockito.BDDMockito.willDoNothing;

@ExtendWith(MockitoExtension.class)
@Import({
        TimelineService.class,
        TimelineValidationService.class,
})
class TimelineServiceTest extends BaseRepositoryTest {

    @MockitoBean
    TimelineValidationService timelineValidationService;

    @Autowired TimelineService timelineService;

    @Autowired
    GroupRepository groupRepository;

    @Autowired
    TimelineAlbumRepository timelineAlbumRepository;

    @Autowired
    TimelineAlbumSectionRepository timelineAlbumSectionRepository;

    @Autowired
    PhotoRepository photoRepository;

    @BeforeEach
    void beforeEach() {
        willDoNothing().given(timelineValidationService).validateAlbumPermission(anyLong(), anyLong());
        willDoNothing().given(timelineValidationService).validateAlbumBelongsToGroup(anyLong(), anyLong());
        willDoNothing().given(timelineValidationService).validateGroupMemberPermission(anyLong());
    }

    @DisplayName("타임라인 앨범 목록을 조회합니다.")
    @Test
    void getTimelineAlbumList() {
        // given
        Group group1 = groupRepository.save(Group.createGroup("TEST", null));
        Group group2 = groupRepository.save(Group.createGroup("TEST", null));

        Photo photo = photoRepository.save(createPhoto(group1));

        TimelineAlbum album1 = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group1, List.of(photo)));
        TimelineAlbum album2 = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group1, List.of(photo)));
        TimelineAlbum album3 = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group1, List.of(photo)));

        TimelineAlbum album4 = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group2, List.of(photo)));
        TimelineAlbum album5 = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group2, List.of(photo)));
        album5.delete();

        int page = 0, size = 2;

        // when
        Page<TimelineAlbumDto> albumDtoPage1 = timelineService.getTimelineAlbumList(group1.getId(), page, size);
        Page<TimelineAlbumDto> albumDtoPage2 = timelineService.getTimelineAlbumList(group2.getId(), page, size);

        // then
        assertThat(albumDtoPage1.getContent().size()).isEqualTo(2);
        assertThat(albumDtoPage1.getTotalElements()).isEqualTo(3);

        assertThat(albumDtoPage2.getContent().size()).isEqualTo(1);
        assertThat(albumDtoPage2.getContent()).extracting("albumId").contains(album4.getId()); // 삭제한 앨범은 조회 X

    }

    @DisplayName("타임라인 앨범을 상세 조회합니다.")
    @Test
    void getTimelineAlbum() {
        // given
        Group group = groupRepository.save(Group.createGroup("TEST", null));

        Photo photo1 = photoRepository.save(createPhoto(group));
        Photo photo2 = photoRepository.save(createPhoto(group));
        Photo photo3 = photoRepository.save(createPhoto(group));

        TimelineAlbum album = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2, photo3)));

        List<TimelineAlbumPhoto> albumPhotos = album.getPhotos();

        TimelineAlbumSection section1 = timelineAlbumSectionRepository.save(createSection(album, albumPhotos.get(0)));
        TimelineAlbumSection section2 = timelineAlbumSectionRepository.save(createSection(album, albumPhotos.get(1)));
        TimelineAlbumSection section3 = timelineAlbumSectionRepository.save(createSection(album));

        // when
        TimelineAlbumDto albumDto = timelineService.getTimelineAlbum(group.getId(), album.getId());

        // then
        assertThat(albumDto.getSections().size()).isEqualTo(3);
        assertThat(albumDto.getSections()).extracting("sectionId").contains(section1.getId(), section2.getId(), section3.getId());

        assertThat(albumDto.getSections().get(0).getPhotos()).extracting("photoId").contains(photo1.getId());
        assertThat(albumDto.getSections().get(1).getPhotos()).extracting("photoId").contains(photo2.getId());
        assertThat(albumDto.getSections().get(2).getPhotos()).isEmpty();

        assertThat(albumDto.getUnusedPhotos()).extracting("photoId").containsOnly(albumPhotos.get(2).getId());
    }

    private Photo createPhoto(Group group) {
        Photo photo = Photo.createPhoto(null, null, null, group);
        photo.upload("https://example.com/photo.jpg");
        photo.uploadThumbnail("https://example.com/thumbnail.jpg");
        return photo;
    }

    private TimelineAlbumSection createSection(TimelineAlbum album, TimelineAlbumPhoto ...photos) {
        TimelineAlbumSection section = TimelineAlbumSection.createTimelineAlbumSection(album);
        section.update("SECTION", "SECTION 설명", LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31));
        for (TimelineAlbumPhoto photo : photos) {
            section.addPhoto(photo);
        }
        return section;
    }

}