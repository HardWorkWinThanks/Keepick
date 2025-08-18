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
import java.util.Objects;

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

    @Enumerated(EnumType.STRING)
    private PhotoStatus status;

    private boolean blurred;

    private Long clusterId;

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

    /**
     * thumbnailUrl에 기본으로 originUrl을 우선 할당하여 null 방지
     */
    public void upload(String originalUrl) {
        this.originalUrl = originalUrl;
        this.thumbnailUrl = originalUrl;
        this.status = PhotoStatus.UPLOADED;
    }

    public void uploadThumbnail(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
        this.status = PhotoStatus.THUMBNAIL_READY;
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

    public void updateBlurred() {
        this.blurred = true;
    }

    public void updateClusterId(Long clusterId) {
        if (!Objects.equals(this.clusterId, clusterId)) {
            this.clusterId = clusterId;
        }
    }

}
