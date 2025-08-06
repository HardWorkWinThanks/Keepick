package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TimelineAlbumRepository extends JpaRepository<TimelineAlbum, Long> {

    @Query("""
        SELECT DISTINCT a
        FROM TimelineAlbum a JOIN FETCH a.sections s
        WHERE a.id = :id
        AND a.deletedAt IS NULL
        ORDER by s.sequence
    """)
    Optional<TimelineAlbum> findAlbumById(Long id);

    List<TimelineAlbum> findAllByGroupId(Long groupId);

}
