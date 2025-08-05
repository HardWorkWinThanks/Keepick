package com.ssafy.keepick.album.tier.persistence;

import java.util.List;
import java.util.Optional;

import com.ssafy.keepick.album.tier.domain.TierAlbum;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TierAlbumRepository extends JpaRepository<TierAlbum, Long> {
    // 그룹별 앨범 목록 조회
    @Query("""
        SELECT t FROM TierAlbum t 
        WHERE t.groupId = :groupId 
        AND t.deletedAt IS NULL 
        ORDER BY t.createdAt DESC
    """)
    List<TierAlbum> findByGroupId(@Param("groupId") Long groupId);

    // 앨범 존재 여부 확인
    @Query("""
        SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END 
        FROM TierAlbum t 
        WHERE t.id = :albumId 
        AND t.deletedAt IS NULL
    """)
    boolean existsById(@Param("albumId") Long albumId);
    
    // 앨범 상세 조회
    @Query("""
        SELECT t FROM TierAlbum t 
        WHERE t.id = :albumId 
        AND t.deletedAt IS NULL
    """)
    Optional<TierAlbum> findAlbumById(@Param("albumId") Long albumId);
}
