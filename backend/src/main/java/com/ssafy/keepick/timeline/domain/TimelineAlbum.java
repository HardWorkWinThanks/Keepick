package com.ssafy.keepick.timeline.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.image.domain.Photo;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    private Integer photoCount;

    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "album")
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

    public void addPhoto(Photo photo) {
        TimelineAlbumPhoto albumPhoto = TimelineAlbumPhoto.createTimelineAlbumPhoto(this, photo);
        this.photos.add(albumPhoto);
    }

    public void loadPhotos(List<TimelineAlbumPhoto> photos) {
        this.photos = (photos != null) ? photos : List.of();
    }

}

