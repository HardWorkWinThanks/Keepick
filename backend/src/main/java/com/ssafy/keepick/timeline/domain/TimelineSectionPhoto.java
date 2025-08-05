package com.ssafy.keepick.timeline.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@ToString(exclude = "section")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class TimelineSectionPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private TimelineSection section;

    @ManyToOne(fetch = FetchType.LAZY)
    private Photo photo;

    private Integer sequence;
}

