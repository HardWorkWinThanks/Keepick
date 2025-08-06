package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TimelineAlbumPhotoRepository extends JpaRepository<TimelineAlbumPhoto, Long> {

    @Query("""
        SELECT tap
        FROM TimelineAlbumPhoto tap
        JOIN FETCH tap.photo p
        WHERE tap.album.id = :albumId
        ORDER BY tap.section.id, tap.sequence
    """)
    List<TimelineAlbumPhoto> findPhotosByAlbumId(Long albumId);
}
