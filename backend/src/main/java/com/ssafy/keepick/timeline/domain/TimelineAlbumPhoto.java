package com.ssafy.keepick.timeline.domain;

import com.ssafy.keepick.photo.domain.Photo;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Objects;

@EqualsAndHashCode(of = {"id"})
@ToString(exclude = {"album", "section"})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class TimelineAlbumPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private TimelineAlbum album;

    @ManyToOne(fetch = FetchType.LAZY)
    private TimelineAlbumSection section;

    @ManyToOne(fetch = FetchType.LAZY)
    private Photo photo;

    private Integer sequence;

    private LocalDateTime deletedAt;

    private TimelineAlbumPhoto(TimelineAlbum album, Photo photo) {
        this.album = album;
        this.photo = photo;
    }

    public static TimelineAlbumPhoto createTimelineAlbumPhoto(TimelineAlbum album, Photo photo) {
        return new TimelineAlbumPhoto(album, photo);
    }

    public void deleteFromSection() {
        updateSection(null);
        updateSequence(null);
    }

    public void updateSection(TimelineAlbumSection section) {
        if (!Objects.equals(this.section, section)) {
            this.section = section;
        }
    }

    public void updateSequence(Integer sequence) {
        if (!Objects.equals(this.sequence, sequence)) {
            this.sequence = sequence;
        }
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

}

