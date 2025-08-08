package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.global.config.QueryDslConfig;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
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
class TimelineAlbumPhotoRepositoryTest {

    @Autowired
    EntityManager entityManager;

    @Autowired
    GroupRepository groupRepository;

    @Autowired
    TimelineAlbumRepository timelineAlbumRepository;

    @Autowired
    TimelineAlbumPhotoRepository timelineAlbumPhotoRepository;

    @Autowired
    PhotoRepository photoRepository;

    @DisplayName("앨범에 포함되지 않은 사진만 조회한다.")
    @Test
    void findNotInAlbumByPhotoIds() {
        // given
        Group group = groupRepository.save(Group.createGroup("group", null));

        Photo photo1 = photoRepository.save(Photo.createPhoto(null, null, null, group));
        Photo photo2 = photoRepository.save(Photo.createPhoto(null, null, null, group));
        photo2.delete();
        Photo photo3 = photoRepository.save(Photo.createPhoto(null, null, null, group));

        TimelineAlbum album = timelineAlbumRepository.save(TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2)));

        entityManager.flush();
        entityManager.clear();

        // when
        List<Photo> notInAlbumPhotos = timelineAlbumPhotoRepository.findNotInAlbumByPhotoIds(album.getId(), List.of(photo1.getId(), photo2.getId(), photo3.getId()));

        // then
        assertThat(notInAlbumPhotos)
                .extracting("id")
                .containsExactlyInAnyOrder(photo3.getId());
    }

}