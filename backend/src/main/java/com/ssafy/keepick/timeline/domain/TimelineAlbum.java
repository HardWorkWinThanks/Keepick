package com.ssafy.keepick.timeline.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.photo.domain.Photo;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@ToString(exclude = {"group", "sections"})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class TimelineAlbum extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private String thumbnailUrl;

    private String originalUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    private Group group;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer photoCount = 0;

    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "album", cascade = CascadeType.ALL)
    private List<TimelineAlbumSection> sections = new ArrayList<>();

    @OneToMany(mappedBy = "album", cascade = CascadeType.ALL)
    private List<TimelineAlbumPhoto> photos = new ArrayList<>();

    private TimelineAlbum(Group group) {
        this.group = group;
    }

    public static TimelineAlbum createTimelineAlbum(Group group, List<Photo> photos) {
        TimelineAlbum album = new TimelineAlbum(group);
        for (Photo photo : photos) {
            album.addPhoto(photo);
        }
        Photo thumbnail = photos.getFirst();
        album.originalUrl = thumbnail.getOriginalUrl();
        album.thumbnailUrl = thumbnail.getThumbnailUrl();
        return album;
    }

    public TimelineAlbumSection createTimelineAlbumSection() {
        TimelineAlbumSection section = TimelineAlbumSection.createTimelineAlbumSection(this);
        this.sections.add(section);
        return section;
    }

    public void removeSection(TimelineAlbumSection section) {
        if (!this.sections.contains(section)) {
            throw new IllegalStateException("해당 섹션은 앨범에 존재하지 않아 삭제할 수 없습니다. sectionId=" + section.getId());
        }
        this.sections.remove(section);
        section.delete();
    }

    public TimelineAlbumPhoto addPhoto(Photo photo) {
        TimelineAlbumPhoto albumPhoto = TimelineAlbumPhoto.createTimelineAlbumPhoto(this, photo);
        this.photos.add(albumPhoto);
        return albumPhoto;
    }

    public void loadSections(List<TimelineAlbumSection> sections) {
        if (sections != null) {
            this.sections = sections;
        }
    }

    public void loadPhotos(List<TimelineAlbumPhoto> photos) {
        if (photos != null) {
            this.photos = photos;
        }
    }

    public void update(String name, String description, Photo thumbnail, LocalDate startDate, LocalDate endDate) {
        if (!Objects.equals(this.name, name)) {
            this.name = name;
        }
        if (!Objects.equals(this.description, description)) {
            this.description = description;
        }
        if (thumbnail != null && !Objects.equals(this.originalUrl, thumbnail.getOriginalUrl())) {
            this.originalUrl = thumbnail.getOriginalUrl();
            this.thumbnailUrl = thumbnail.getThumbnailUrl();
        }
        if (!Objects.equals(this.startDate, startDate)) {
            this.startDate = startDate;
        }
        if (!Objects.equals(this.endDate, endDate)) {
            this.endDate = endDate;
        }
    }

    public void increasePhotoCount() {
        this.photoCount++;
    }

    public void decreasePhotoCount() {
        if (this.photoCount == 0) {
            throw new IllegalStateException("앨범의 사진 수가 이미 0이므로 감소시킬 수 없습니다. albumId=" + this.id);
        }
        this.photoCount--;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

}

