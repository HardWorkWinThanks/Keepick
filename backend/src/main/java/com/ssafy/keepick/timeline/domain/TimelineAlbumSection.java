package com.ssafy.keepick.timeline.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@EqualsAndHashCode(of = {"id"})
@ToString(exclude = {"photos", "album"})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Entity
public class TimelineAlbumSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;

    private Integer sequence;

    @ManyToOne(fetch = FetchType.LAZY)
    private TimelineAlbum album;

    @OneToMany(mappedBy = "section")
    private List<TimelineAlbumPhoto> photos = new ArrayList<>();

    public TimelineAlbumSection(TimelineAlbum album) {
        this.album = album;
    }

    public static TimelineAlbumSection createTimelineAlbumSection(TimelineAlbum album) {
        return new TimelineAlbumSection(album);
    }

    public void update(String name, String description, LocalDate startDate, LocalDate endDate) {
        if (!Objects.equals(this.name, name)) {
            this.name = name;
        }
        if (!Objects.equals(this.description, description)) {
            this.description = description;
        }
        if (!Objects.equals(this.startDate, startDate)) {
            this.startDate = startDate;
        }
        if (!Objects.equals(this.endDate, endDate)) {
            this.endDate = endDate;
        }
    }

    public void updateSequence(Integer sequence) {
        if (!Objects.equals(sequence, this.sequence)) {
            this.sequence = sequence;
        }
    }

    public void addPhoto(TimelineAlbumPhoto photo) {
        if(this.photos.contains(photo)) {
            throw new IllegalStateException("해당 사진은 이미 섹션에 포함되어 있습니다. photoId=" + photo.getId());
        }
        this.photos.add(photo);
        photo.updateSection(this);
        this.album.increasePhotoCount();
    }

    public void removePhoto(TimelineAlbumPhoto photo) {
        if (this.photos.remove(photo)) {
            photo.removeFromSection();
            this.album.decreasePhotoCount();
        }
    }

    public void removeFromAlbum() {
        // 섹션에 포함된 사진을 사용하지 않는 상태로 바꿈
        for (var photo : new ArrayList<>(this.photos)) {
            this.removePhoto(photo);
        }
    }

}