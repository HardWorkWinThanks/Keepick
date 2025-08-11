package com.ssafy.keepick.album.tier.domain;


import com.ssafy.keepick.photo.domain.Photo;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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

    private LocalDateTime deletedAt;

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
    
    /**
     * 티어와 시퀀스를 한 번에 업데이트하는 메서드
     * 
     * @param tier 새로운 티어 (null 가능)
     * @param sequence 새로운 시퀀스
     */
    public void updateTierAndSequence(Tier tier, Integer sequence) {
        this.tier = tier;
        this.sequence = sequence;
    }
    
    /**
     * 티어를 초기화하는 메서드 (null로 설정)
     */
    public void resetTier() {
        this.tier = null;
    }
}
