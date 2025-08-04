package com.ssafy.keepick.image.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.group.domain.Group;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "`photo`")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Photo extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String originalUrl;

    private String thumbnailUrl;

    private LocalDateTime takenAt;

    private LocalDateTime deletedAt;

    private Integer width;

    private Integer height;

    @ManyToOne(fetch = FetchType.LAZY)
    private Group group;

    @Builder
    public Photo(String originalUrl, LocalDateTime takenAt, Integer width, Integer height, Group group) {
        this.originalUrl = originalUrl;
        this.takenAt = takenAt;
        this.width = width;
        this.height = height;
        this.group = group;
    }

}
