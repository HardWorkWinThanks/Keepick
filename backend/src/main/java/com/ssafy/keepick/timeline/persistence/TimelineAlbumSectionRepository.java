package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TimelineAlbumSectionRepository extends JpaRepository<TimelineAlbumSection, Long> {

    @Query("""
        SELECT DISTINCT tas
        FROM TimelineAlbumSection tas
        LEFT JOIN FETCH tas.photos tsp
        LEFT JOIN FETCH tsp.photo p
        WHERE tas.album.id = :albumId
        AND tas.deletedAt IS NULL
        AND tsp.deletedAt IS NULL
        ORDER BY tas.sequence ASC, tsp.sequence ASC
    """)
    List<TimelineAlbumSection> findAllByAlbumId(@Param("albumId") Long albumId);


}
