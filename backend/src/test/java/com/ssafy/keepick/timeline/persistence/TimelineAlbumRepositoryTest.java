package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.support.BaseRepositoryTest;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class TimelineAlbumRepositoryTest extends BaseRepositoryTest {

    @Autowired
    EntityManager entityManager;

    @Autowired
    GroupRepository groupRepository;

    @Autowired
    TimelineAlbumRepository timelineAlbumRepository;

    @Autowired
    TimelineAlbumSectionRepository timelineAlbumSectionRepository;

    @Autowired
    PhotoRepository photoRepository;

    @DisplayName("타임라인 앨범을 섹션 정보와 함께 조회합니다.")
    @Test
    void findAlbumWithSectionsByIdAndDeletedAtIsNull() {
        // given
        Group group = groupRepository.save(Group.createGroup("Group", null));

        Photo photo = photoRepository.save(Photo.createPhoto(null, null, null, group));

        TimelineAlbum album1 = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo)));
        TimelineAlbum album2 = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo)));
        album2.delete();

        TimelineAlbumSection section1 = album1.createTimelineAlbumSection();
        TimelineAlbumSection section2 = album1.createTimelineAlbumSection();
        TimelineAlbumSection section3 = album1.createTimelineAlbumSection();
        section3.delete();

        entityManager.flush();
        entityManager.clear();

        // when
        TimelineAlbum findAlbum1 = timelineAlbumRepository.findAlbumWithSectionsByIdAndDeletedAtIsNull(album1.getId()).get();
        Optional<TimelineAlbum> findAlbum2 = timelineAlbumRepository.findAlbumWithSectionsByIdAndDeletedAtIsNull(album2.getId());

        // then
        assertThat(findAlbum1.getId()).isEqualTo(album1.getId());
        assertThat(findAlbum1.getSections().size()).isEqualTo(2);
        assertThat(findAlbum1.getSections()).containsExactly(section1, section2);
        assertThat(findAlbum1.getSections()).doesNotContain(section3);

        assertThat(findAlbum2.isEmpty()).isTrue();
    }
}