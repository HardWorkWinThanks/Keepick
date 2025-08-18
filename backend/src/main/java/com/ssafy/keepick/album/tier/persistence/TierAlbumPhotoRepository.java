package com.ssafy.keepick.album.tier.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ssafy.keepick.album.tier.domain.Tier;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;

public interface TierAlbumPhotoRepository extends JpaRepository<TierAlbumPhoto, Long> {
    
    // 앨범의 사진들 조회 (순서대로)
    @Query("""
        SELECT tp FROM TierAlbumPhoto tp 
        WHERE tp.album.id = :albumId 
        ORDER BY tp.sequence
    """)
    List<TierAlbumPhoto> findByAlbumId(@Param("albumId") Long albumId);

    // ===== 더 이상 사용하지 않는 메서드들 (JPA 영속성 컨텍스트 기반으로 변경됨) =====
    
    // 배치 업데이트: 앨범의 모든 사진을 제외 상태로 초기화
    // @Deprecated - JPA 영속성 컨텍스트를 활용한 방식으로 변경됨
    /*
    @Modifying
    @Query("""
        UPDATE TierAlbumPhoto tp 
        SET tp.tier = NULL 
        WHERE tp.album.id = :albumId
    """)
    void resetAllTiersByAlbumId(@Param("albumId") Long albumId);
    */

    // 배치 업데이트: 요청되지 않은 사진들을 제외 상태로 설정
    // @Deprecated - JPA 영속성 컨텍스트를 활용한 방식으로 변경됨
    /*
    @Modifying
    @Query("""
        UPDATE TierAlbumPhoto tp 
        SET tp.tier = NULL 
        WHERE tp.album.id = :albumId AND tp.photo.id NOT IN :photoIds
    """)
    void excludePhotosNotInList(@Param("albumId") Long albumId, @Param("photoIds") List<Long> photoIds);
    */

    // 배치 업데이트: 특정 사진들의 티어 설정
    // @Deprecated - JPA 영속성 컨텍스트를 활용한 방식으로 변경됨
    /*
    @Modifying
    @Query("""
        UPDATE TierAlbumPhoto tp 
        SET tp.tier = :tier 
        WHERE tp.album.id = :albumId AND tp.photo.id IN :photoIds
    """)
    void updateTiersByPhotoIds(@Param("albumId") Long albumId, @Param("tier") Tier tier, @Param("photoIds") List<Long> photoIds);
    */

    // 개별 사진의 티어와 sequence 업데이트
    // @Deprecated - JPA 영속성 컨텍스트를 활용한 방식으로 변경됨
    /*
    @Modifying
    @Query("""
        UPDATE TierAlbumPhoto tp 
        SET tp.tier = :tier, tp.sequence = :sequence 
        WHERE tp.album.id = :albumId AND tp.photo.id = :photoId
    """)
    void updateTierAndSequenceByPhotoId(@Param("albumId") Long albumId, @Param("photoId") Long photoId, @Param("tier") Tier tier, @Param("sequence") int sequence);
    */
}
