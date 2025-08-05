package com.ssafy.keepick.album.tier.persistence;

import java.util.List;

import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TierAlbumPhotoRepository extends JpaRepository<TierAlbumPhoto, Long> {
    
    // 앨범의 사진들 조회 (순서대로)
    @Query("""
        SELECT tp FROM TierAlbumPhoto tp 
        WHERE tp.albumId = :albumId 
        ORDER BY tp.sequence
    """)
    List<TierAlbumPhoto> findByAlbumId(@Param("albumId") Long albumId);
}
