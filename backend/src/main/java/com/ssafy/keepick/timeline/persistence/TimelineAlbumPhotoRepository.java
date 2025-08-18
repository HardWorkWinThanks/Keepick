package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TimelineAlbumPhotoRepository extends JpaRepository<TimelineAlbumPhoto, Long> {

    @EntityGraph(attributePaths = "photo")
    List<TimelineAlbumPhoto> findUnusedPhotosByAlbumIdAndSectionIsNull(Long albumId);

    // 주어진 사진 목록 중 타임라인 앨범에 없는 사진 조회
    @Query("""
        SELECT p
        FROM Photo p
        WHERE p.id IN :photoIds
        AND p.id NOT IN (
            SELECT tap.photo.id
            FROM TimelineAlbumPhoto tap
            WHERE tap.album.id = :albumId
        )
    """)
    List<Photo> findNotInAlbumByPhotoIds(@Param("albumId") Long albumId, @Param("photoIds") List<Long> photoIds);

    @Query("""
        SELECT tap
        FROM TimelineAlbumPhoto tap
        WHERE tap.album.id = :albumId
        AND tap.photo.id IN :photoIds
    """)
    List<TimelineAlbumPhoto> findAllByAlbumIdAndPhotoIdIn(@Param("albumId") Long albumId, @Param("photoIds") List<Long> photoIds);

    @EntityGraph(attributePaths = {"section", "photo"})
    List<TimelineAlbumPhoto> findAllByAlbumId(Long albumId);
}
