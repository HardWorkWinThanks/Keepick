package com.ssafy.keepick.timeline.domain;

import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.support.BaseTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TimelineAlbumTest extends BaseTest {

    @DisplayName("타임라인 앨범 생성 시 그룹과 사진 목록이 필요하다.")
    @Test
    void createTimelineAlbum() {
        // given
        Group group = Group.createGroup("TEST", null);

        Photo photo1 = createPhoto(group);
        Photo photo2 = createPhoto(group);

        // when
        TimelineAlbum album = TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2));

        // then
        assertThat(album.getGroup()).isEqualTo(group);
        // 생성 시 받은 사진 2개를 포함
        assertThat(album.getPhotos().size()).isEqualTo(2);
        assertThat(album.getPhotos().get(0).getPhoto()).isEqualTo(photo1);
        assertThat(album.getPhotos().get(1).getPhoto()).isEqualTo(photo2);
        // 썸네일은 첫번재 사진으로 한다
        assertThat(album.getOriginalUrl()).isEqualTo(photo1.getOriginalUrl());
        assertThat(album.getThumbnailUrl()).isEqualTo(photo1.getThumbnailUrl());
    }

    @DisplayName("타임라인 앨범에 섹션을 추가한다.")
    @Test
    void addSectionToTimelineAlbum() {
        // given
        Group group = Group.createGroup("TEST", null);

        Photo photo1 = createPhoto(group);
        Photo photo2 = createPhoto(group);

        TimelineAlbum album = TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2));

        // when
        TimelineAlbumSection section = album.createTimelineAlbumSection();

        // then
        assertThat(album.getSections()).containsExactly(section);
        assertThat(section.getAlbum()).isEqualTo(album);
    }

    @DisplayName("타임라인 앨범에서 섹션을 삭제한다.")
    @Test
    void removeSectionFromTimelineAlbum() {
        // given
        Group group = Group.createGroup("TEST", null);

        Photo photo1 = createPhoto(group);
        Photo photo2 = createPhoto(group);

        TimelineAlbum album = TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2));
        TimelineAlbumSection section = album.createTimelineAlbumSection();

        // when
        album.removeSection(section);

        // then
        assertThat(album.getSections()).doesNotContain(section);
    }

    @DisplayName("타임라인 앨범의 사진 개수는 섹션에 포함된 사진 개수와 같다.")
    @Test
    void countPhotoInTimelineAlbum() {
        // given
        Group group = Group.createGroup("TEST", null);

        Photo photo = createPhoto(group);

        TimelineAlbum album = TimelineAlbum.createTimelineAlbum(group, List.of(photo));
        TimelineAlbumSection section = album.createTimelineAlbumSection();

        TimelineAlbumPhoto albumPhoto = album.getPhotos().get(0);

        // when & then
        // 초기에는 앨범에 섹션이 없으므로 사진은 0개이다
        assertThat(album.getPhotoCount()).isEqualTo(0);

        // 섹션에 사진 추가
        section.addPhoto(albumPhoto);
        assertThat(album.getPhotoCount()).isEqualTo(1);

        // 섹션에서 사진 삭제
        section.removePhoto(albumPhoto);
        assertThat(album.getPhotoCount()).isEqualTo(0);

        // 섹션을 삭제하면 섹션 내 사진도 모두 사용하지 않는 사진이 된다.
        section.addPhoto(albumPhoto);
        album.removeSection(section);
        assertThat(album.getPhotoCount()).isEqualTo(0);
    }

    @DisplayName("타임라인 섹션에 똑같은 사진을 추가할 수 없다.")
    @Test
    void addDuplicatePhotoToTimelineAlbum() {
        // given
        Group group = Group.createGroup("TEST", null);

        Photo photo = createPhoto(group);

        TimelineAlbum album = TimelineAlbum.createTimelineAlbum(group, List.of(photo));
        TimelineAlbumSection section = album.createTimelineAlbumSection();

        TimelineAlbumPhoto albumPhoto = album.getPhotos().get(0);

        // when & then
        section.addPhoto(albumPhoto);
        assertThrows(IllegalStateException.class, () -> section.addPhoto(albumPhoto));
    }

    @DisplayName("타임라인 섹션에서 사진을 삭제한다.")
    @Test
    void removePhotoFromTimelineSection() {
        // given
        Group group = Group.createGroup("TEST", null);

        Photo photo1 = createPhoto(group);
        Photo photo2 = createPhoto(group);

        TimelineAlbum album = TimelineAlbum.createTimelineAlbum(group, List.of(photo1, photo2));
        TimelineAlbumSection section = album.createTimelineAlbumSection();

        TimelineAlbumPhoto albumPhoto = album.getPhotos().get(0);

        // section에 두 사진 추가
        section.addPhoto(albumPhoto);

        // when
        section.removePhoto(albumPhoto);

        // then
        assertThat(section.getPhotos()).doesNotContain(albumPhoto);
        assertThat(albumPhoto.getSection()).isNull();

        assertThat(album.getPhotos()).contains(albumPhoto);
        assertThat(albumPhoto.getAlbum()).isEqualTo(album);

    }

    private Photo createPhoto(Group group) {
        Photo photo = Photo.createPhoto(null, null, null, group);
        photo.upload("https://example.com/photo.jpg");
        photo.uploadThumbnail("https://example.com/thumbnail.jpg");
        return photo;
    }

}