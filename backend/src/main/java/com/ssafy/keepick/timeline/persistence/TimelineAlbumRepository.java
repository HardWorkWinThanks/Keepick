package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TimelineAlbumRepository extends JpaRepository<TimelineAlbum, Long> {

    @Query("""
        select a
        from TimelineAlbum a join fetch a.sections s
        where a.id = :id
        and a.deletedAt is null
        order by s.sequence
    """)
    Optional<TimelineAlbum> findAlbumById(Long id);

}
