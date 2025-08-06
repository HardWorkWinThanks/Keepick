package com.ssafy.keepick.photo.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.group.domain.Group;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@Table(name = "`photo`")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Photo extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 500)
    private String originalUrl;

    @Column(length = 500)
    private String thumbnailUrl;

    private LocalDateTime takenAt;

    private LocalDateTime deletedAt;

    private Integer width;

    private Integer height;

    private PhotoStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    private Group group;

    @OneToMany(mappedBy = "photo", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<PhotoMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "photo", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<PhotoTag> tags = new ArrayList<>();

    @Builder
    public Photo(String originalUrl, LocalDateTime takenAt, Integer width, Integer height, Group group, PhotoStatus status) {
        this.originalUrl = originalUrl;
        this.takenAt = takenAt;
        this.width = width;
        this.height = height;
        this.status = status;
        this.group = group;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void upload(String originalUrl) {
        this.originalUrl = originalUrl;
        this.status = PhotoStatus.UPLOADED;
    }

    public static Photo createPhoto(LocalDateTime takenAt, Integer width, Integer height, Group group) {
        return Photo.builder()
                .takenAt(takenAt)
                .width(width)
                .height(height)
                .group(group)
                .status(PhotoStatus.PENDING_UPLOAD)
                .build();
    }

}
