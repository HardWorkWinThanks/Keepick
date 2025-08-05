package com.ssafy.keepick.timeline.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.group.domain.Group;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

}

