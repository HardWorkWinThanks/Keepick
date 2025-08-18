package com.ssafy.keepick.album.tier.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Entity
@Table(name = "tier_album")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TierAlbum extends BaseTimeEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "original_url")
    private String originalUrl;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "photo_count")
    private Integer photoCount = 0;

    @OneToMany(mappedBy = "album", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TierAlbumPhoto> tierAlbumPhotos = new ArrayList<>();

    private TierAlbum(String name, String description, String thumbnailUrl, String originalUrl, Long groupId) {
        this.name = name;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.originalUrl = originalUrl;
        this.groupId = groupId;
    }

    public static TierAlbum createTierAlbum(String name, String description, String thumbnailUrl, String originalUrl, Long groupId) {
        return new TierAlbum(name, description, thumbnailUrl, originalUrl, groupId);
    }

    public static TierAlbum createTierAlbum(Long groupId) {
        return new TierAlbum(null, null, null, null, groupId);
    }

    public void update(String name, String description, String thumbnailUrl, String originalUrl) {
        this.name = name;
        this.description = description;
        this.updateThumbnail(originalUrl, thumbnailUrl);
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void increasePhotoCount() {
        this.photoCount++;
    }

    public void decreasePhotoCount() {
        if (this.photoCount > 0) {
            this.photoCount--;
        }
    }

    public void updatePhotoCount(int count) {
        this.photoCount = count;
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }

    // 모든 사진 목록 조회 (순서대로)
    public List<TierAlbumPhoto> getAllPhotos() {
        return this.tierAlbumPhotos.stream()
            .sorted((p1, p2) -> Integer.compare(p1.getSequence(), p2.getSequence()))
            .collect(Collectors.toList());
    }

    public void updateThumbnail(String originalUrl, String thumbnailUrl) {
        if (originalUrl != null ){
            this.originalUrl = originalUrl;
        }
        if (thumbnailUrl != null) {
            this.thumbnailUrl = thumbnailUrl;
        }
    }
}
