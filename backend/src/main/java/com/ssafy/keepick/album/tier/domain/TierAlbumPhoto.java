package com.ssafy.keepick.album.tier.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tier_album_photo")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TierAlbumPhoto {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "album_id")
    private Long albumId;

    @Column(name = "photo_id")
    private Long photoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tier")
    private Tier tier;

    @Column(name = "sequence")
    private Integer sequence;

    private TierAlbumPhoto(Long albumId, Long photoId, Tier tier, Integer sequence) {
        this.albumId = albumId;
        this.photoId = photoId;
        this.tier = tier;
        this.sequence = sequence;
    }

    public static TierAlbumPhoto createTierAlbumPhoto(Long albumId, Long photoId, Tier tier, Integer sequence) {
        return new TierAlbumPhoto(albumId, photoId, tier, sequence);
    }

    public void updateTier(Tier tier) {
        this.tier = tier;
    }

    public void updateSequence(Integer sequence) {
        this.sequence = sequence;
    }

    public void updatePhoto(Long photoId) {
        this.photoId = photoId;
    }
}
