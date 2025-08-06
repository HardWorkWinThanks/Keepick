package com.ssafy.keepick.album.tier.domain;

import com.ssafy.keepick.image.domain.Photo;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id")
    private TierAlbum album;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photo_id")
    private Photo photo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tier")
    private Tier tier;

    @Column(name = "sequence")
    private Integer sequence;

    private TierAlbumPhoto(TierAlbum album, Photo photo, Tier tier, Integer sequence) {
        this.album = album;
        this.photo = photo;
        this.tier = tier;
        this.sequence = sequence;
    }

    public static TierAlbumPhoto createTierAlbumPhoto(TierAlbum album, Photo photo, Tier tier, Integer sequence) {
        return new TierAlbumPhoto(album, photo, tier, sequence);
    }

    public void updateTier(Tier tier) {
        this.tier = tier;
    }

    public void updateSequence(Integer sequence) {
        this.sequence = sequence;
    }
}
