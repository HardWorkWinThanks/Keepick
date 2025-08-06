package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TimelineAlbumRepository extends JpaRepository<TimelineAlbum, Long> {

    Optional<TimelineAlbum> findAlbumByIdAndDeletedAtIsNull(Long id);

    @Query("""
        SELECT DISTINCT a
        FROM TimelineAlbum a
        LEFT JOIN FETCH a.sections s
        WHERE a.id = :id
          AND a.deletedAt IS NULL
          AND s.deletedAt IS NULL
    """)
    Optional<TimelineAlbum> findAlbumWithSectionsByIdAndDeletedAtIsNull(@Param("id") Long id);

    Page<TimelineAlbum> findAllByGroupIdAndDeletedAtIsNull(Long groupId, Pageable pageable);

}
