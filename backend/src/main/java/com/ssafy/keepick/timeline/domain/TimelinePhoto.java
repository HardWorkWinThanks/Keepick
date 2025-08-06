package com.ssafy.keepick.timeline.domain;

import com.ssafy.keepick.image.domain.Photo;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@ToString(exclude = {"album", "section"})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class TimelinePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private TimelineAlbum album;

    @ManyToOne(fetch = FetchType.LAZY)
    private TimelineSection section;

    @ManyToOne(fetch = FetchType.LAZY)
    private Photo photo;

    private Integer sequence;

    private Boolean included;
}

