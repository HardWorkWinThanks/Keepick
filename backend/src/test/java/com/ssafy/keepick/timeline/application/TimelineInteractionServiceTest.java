package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.support.BaseRepositoryTest;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumPhotoDto;
import com.ssafy.keepick.timeline.controller.request.TimelineCreateRequest;
import com.ssafy.keepick.timeline.controller.request.TimelinePhotoRequest;
import com.ssafy.keepick.timeline.controller.request.TimelineUpdateRequest;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumPhotoRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumSectionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.willDoNothing;

@ExtendWith(MockitoExtension.class)
@Import({
        TimelineInteractionService.class,
        TimelineValidationService.class,
})
class TimelineInteractionServiceTest extends BaseRepositoryTest {

    @MockitoBean
    TimelineValidationService timelineValidationService;

    @Autowired
    EntityManager entityManager;

    @Autowired
    TimelineInteractionService timelineInteractionService;

    @Autowired
    GroupRepository groupRepository;

    @Autowired
    TimelineAlbumRepository timelineAlbumRepository;

    @Autowired
    TimelineAlbumSectionRepository timelineAlbumSectionRepository;

    @Autowired
    TimelineAlbumPhotoRepository timelineAlbumPhotoRepository;

    @Autowired
    PhotoRepository photoRepository;

    @BeforeEach
    void beforeEach() {
        willDoNothing().given(timelineValidationService).validateAlbumPermission(anyLong(), anyLong());
        willDoNothing().given(timelineValidationService).validateAlbumBelongsToGroup(anyLong(), anyLong());
        willDoNothing().given(timelineValidationService).validateGroupMemberPermission(anyLong());
    }

    @DisplayName("타임라인 앨범을 생성합니다. 생성 시 그룹과 사진 목록이 반드시 필요합니다.")
    @Test
    void createTimelineAlbum() {
        // given
        Group group = groupRepository.save(Group.createGroup("TEST", null));

        Photo photo = photoRepository.save(createPhoto(group));

        TimelineCreateRequest request = TimelineCreateRequest.builder().photoIds(List.of(photo.getId())).build();

        // when
        TimelineAlbumDto dto = timelineInteractionService.createTimelineAlbum(group.getId(), request);

        // then
        assertThat(dto.getAlbumId()).isNotNull();
        assertThat(dto.getName()).isNull();
        assertThat(dto.getCreatedAt()).isNotNull();
        assertThat(dto.getOriginalUrl()).isEqualTo(photo.getOriginalUrl());
    }

    @DisplayName("타임라인 앨범을 삭제합니다.")
    @Test
    void deleteTimelineAlbum() {
        // given
        Group group = groupRepository.save(Group.createGroup("TEST", null));

        Photo photo = photoRepository.save(createPhoto(group));

        TimelineAlbum album = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo)));

        // when
        timelineInteractionService.deleteTimelineAlbum(group.getId(), photo.getId());

        // then
        assertThat(album.getDeletedAt()).isNotNull();
    }

    @DisplayName("타임라인 앨범을 수정합니다. 새로운 섹션을 생성합니다.")
    @Test
    void updateTimelineAlbum_createSection() {
        // given
        Group group = groupRepository.save(Group.createGroup("TEST", null));

        Photo photo1 = photoRepository.save(createPhoto(group));
        Photo photo2 = photoRepository.save(createPhoto(group));
        Photo photo3 = photoRepository.save(createPhoto(group));
        Photo photo4 = photoRepository.save(createPhoto(group));

        TimelineAlbum album = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2, photo3, photo4)));

        // 수정 정보 - 섹션 1개 생성 (사진 1,2)
        TimelineUpdateRequest.SectionUpdateRequest sectionUpdateRequest = createSectionUpdateRequest(null, List.of(photo1, photo2));
        TimelineUpdateRequest request = createUpdateRequest(photo1, List.of(sectionUpdateRequest));

        // when
        TimelineAlbumDto dto = timelineInteractionService.updateTimelineAlbum(group.getId(), album.getId(), request);
        List<TimelineAlbumSection> sections = timelineAlbumSectionRepository.findAllByAlbumId(album.getId());

        // then
        assertThat(dto.getPhotoCount()).isEqualTo(2);

        assertThat(sections.size()).isEqualTo(1);
        // 섹션 내 사진 순서 1,2
        assertThat(sections.get(0).getPhotos().get(0).getPhoto().getId()).isEqualTo(photo1.getId());
        assertThat(sections.get(0).getPhotos().get(1).getPhoto().getId()).isEqualTo(photo2.getId());
    }

    @DisplayName("타임라인 앨범을 수정합니다. 기존 섹션 내 사진을 변경합니다.")
    @Test
    void updateTimelineAlbum_changeSection() {
        // given
        Group group = groupRepository.save(Group.createGroup("TEST", null));

        Photo photo1 = photoRepository.save(createPhoto(group));
        Photo photo2 = photoRepository.save(createPhoto(group));
        Photo photo3 = photoRepository.save(createPhoto(group));

        TimelineAlbum album = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2, photo3)));

        List<TimelineAlbumPhoto> albumPhotos = album.getPhotos();
        TimelineAlbumSection section = timelineAlbumSectionRepository.save(createSection(album));

        // 수정 정보 - 사진 2,3 변경
        TimelineUpdateRequest.SectionUpdateRequest sectionUpdateRequest = createSectionUpdateRequest(section.getId(), List.of(photo2, photo3));
        TimelineUpdateRequest request = createUpdateRequest(photo1, List.of(sectionUpdateRequest));

        entityManager.flush();
        entityManager.clear();

        // when
        TimelineAlbumDto dto = timelineInteractionService.updateTimelineAlbum(group.getId(), album.getId(), request);
        List<TimelineAlbumSection> sections = timelineAlbumSectionRepository.findAllByAlbumId(album.getId());

        // then
        assertThat(dto.getPhotoCount()).isEqualTo(2);

        assertThat(sections.size()).isEqualTo(1);

        // 섹션 내 사진 순서 2,3
        List<TimelineAlbumPhoto> changedSectionPhotos = sections.get(0).getPhotos();
        assertThat(changedSectionPhotos.get(0).getPhoto().getId()).isEqualTo(photo2.getId());
        assertThat(changedSectionPhotos.get(1).getPhoto().getId()).isEqualTo(photo3.getId());
    }

    @DisplayName("타임라인 앨범을 수정합니다. 기존 섹션을 삭제합니다.")
    @Test
    void updateTimelineAlbum_deleteSection() {
        // given
        Group group = groupRepository.save(Group.createGroup("TEST", null));

        Photo photo1 = photoRepository.save(createPhoto(group));
        Photo photo2 = photoRepository.save(createPhoto(group));
        Photo photo3 = photoRepository.save(createPhoto(group));

        TimelineAlbum album = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2, photo3)));

        List<TimelineAlbumPhoto> albumPhotos = album.getPhotos();
        TimelineAlbumSection section = timelineAlbumSectionRepository.save(createSection(album));

        entityManager.flush();
        entityManager.clear();

        // 수정 정보 - 섹션 삭제
        TimelineUpdateRequest request = createUpdateRequest(photo1, List.of());

        // when
        TimelineAlbumDto dto = timelineInteractionService.updateTimelineAlbum(group.getId(), album.getId(), request);

        List<TimelineAlbumSection> sections = timelineAlbumSectionRepository.findAllByAlbumId(album.getId());

        // then
        assertThat(dto.getPhotoCount()).isEqualTo(0);

        System.out.println("sections = " + sections);
        assertThat(sections.size()).isEqualTo(0);
    }

    @DisplayName("타임라인 앨범에 사진을 추가합니다. 이미 앨범에 포함된 사진은 추가되지 않습니다.")
    @Test
    void addPhotoToTimelineAlbum() {
        // given
        Group group = groupRepository.save(Group.createGroup("TEST", null));

        Photo photo = photoRepository.save(createPhoto(group));
        Photo photo1 = photoRepository.save(createPhoto(group));
        Photo photo2 = photoRepository.save(createPhoto(group));

        TimelineAlbum album = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo)));

        TimelinePhotoRequest request = TimelinePhotoRequest.builder().photoIds(List.of(photo.getId(), photo1.getId(), photo2.getId())).build();

        // when
        List<TimelineAlbumPhotoDto> dtoList = timelineInteractionService.addPhotoToTimelineAlbum(group.getId(), album.getId(), request);

        // then
        assertThat(dtoList.size()).isEqualTo(2);
        assertThat(dtoList).extracting("photoId").contains(photo1.getId(), photo2.getId());
        assertThat(dtoList).extracting("photoId").doesNotContain(photo.getId());
    }

    @DisplayName("타임라인 앨범에서 사진을 삭제합니다.")
    @Test
    void deletePhotoFromTimelineAlbum() {
        // given
        Group group = groupRepository.save(Group.createGroup("TEST", null));

        Photo photo = photoRepository.save(createPhoto(group));

        TimelineAlbum album = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo)));

        TimelinePhotoRequest request = TimelinePhotoRequest.builder().photoIds(List.of(photo.getId())).build();

        // when
        timelineInteractionService.deletePhotoFromTimelineAlbum(group.getId(), album.getId(), request);
        List<TimelineAlbumPhoto> photos = timelineAlbumPhotoRepository.findAllByAlbumIdAndDeletedAtIsNull(album.getId());

        // then
        assertThat(photos).extracting("id").doesNotContain(photo.getId());
    }

    private Photo createPhoto(Group group) {
        Photo photo = Photo.createPhoto(null, null, null, group);
        photo.upload("https://example.com/photo.jpg");
        photo.uploadThumbnail("https://example.com/thumbnail.jpg");
        return photo;
    }

    private TimelineAlbumSection createSection(TimelineAlbum album, TimelineAlbumPhoto...photos) {
        TimelineAlbumSection section = TimelineAlbumSection.createTimelineAlbumSection(album);
        section.update("SECTION", "SECTION 설명", LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31));
        for (TimelineAlbumPhoto photo : photos) {
            section.addPhoto(photo);
        }
        return section;
    }

    private TimelineUpdateRequest createUpdateRequest(Photo thumbnail, List<TimelineUpdateRequest.SectionUpdateRequest> sectionRequests) {
        return TimelineUpdateRequest
                .builder()
                .name("NAME")
                .description("DESCRIPTION")
                .startDate(LocalDate.of(2020, 1, 1))
                .endDate(LocalDate.of(2020, 1, 2))
                .thumbnailId(thumbnail.getId())
                .sections(sectionRequests)
                .build();
    }

    private TimelineUpdateRequest.SectionUpdateRequest createSectionUpdateRequest(Long sectionId, List<Photo> photos) {
        return TimelineUpdateRequest.SectionUpdateRequest
                .builder()
                .id(sectionId)
                .name("NAME")
                .description("DESCRIPTION")
                .startDate(LocalDate.of(2020, 1, 1))
                .endDate(LocalDate.of(2020, 1, 1))
                .photoIds(photos.stream().map(Photo::getId).toList())
                .build();
    }
}