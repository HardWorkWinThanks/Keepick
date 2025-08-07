package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.global.config.QueryDslConfig;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

@Import(QueryDslConfig.class)
@DataJpaTest
class TimelineAlbumSectionRepositoryTest {

    @Autowired
    EntityManager entityManager;

    @Autowired
    GroupRepository groupRepository;

    @Autowired
    PhotoRepository photoRepository;

    @Autowired
    TimelineAlbumRepository timelineAlbumRepository;

    @Autowired
    TimelineAlbumSectionRepository timelineAlbumSectionRepository;

    @DisplayName("앨범에 속한 섹션 목록을 사진과 함께 순서대로 조회한다")
    @Test
    void findAllByAlbumId() {
        // given
        Group group = groupRepository.save(Group.createGroup("group", null));

        Photo photo1 = photoRepository.save(Photo.createPhoto(null, null, null, group));
        Photo photo2 = photoRepository.save(Photo.createPhoto(null, null, null, group));
        Photo photo3 = photoRepository.save(Photo.createPhoto(null, null, null, group));

        TimelineAlbum album = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2, photo3)));

        TimelineAlbumSection section1 = album.createTimelineAlbumSection();
        TimelineAlbumSection section2 = album.createTimelineAlbumSection();

        List<TimelineAlbumPhoto> photos = album.getPhotos();
        TimelineAlbumPhoto albumPhoto1 = photos.get(0);
        TimelineAlbumPhoto albumPhoto2 = photos.get(1);
        TimelineAlbumPhoto albumPhoto3 = photos.get(2);

        section1.addPhoto(albumPhoto1);
        section1.addPhoto(albumPhoto2);
        section2.addPhoto(albumPhoto3);

        entityManager.flush();
        entityManager.clear();

        // when
        List<TimelineAlbumSection> sections = timelineAlbumSectionRepository.findAllByAlbumId(album.getId());

        // then
        assertThat(sections).hasSize(2);
        assertThat(sections.get(0).getPhotos()).hasSize(2);
        assertThat(sections.get(1).getPhotos()).hasSize(1);

        assertThat(sections.get(0).getPhotos().get(0).getPhoto().getId()).isEqualTo(photo1.getId());
        assertThat(sections.get(0).getPhotos().get(1).getPhoto().getId()).isEqualTo(photo2.getId());
        assertThat(sections.get(1).getPhotos().get(0).getPhoto().getId()).isEqualTo(photo3.getId());
    }
}