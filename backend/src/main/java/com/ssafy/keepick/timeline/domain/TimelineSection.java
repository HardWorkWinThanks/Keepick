package com.ssafy.keepick.timeline.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@ToString(exclude = {"photos", "album"})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class TimelineSection {
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
    private List<TimelineSectionPhoto> photos = new ArrayList<>();

    public void loadPhotos(List<TimelineSectionPhoto> photos) {
        this.photos = (photos != null) ? photos : List.of();
    }
}
