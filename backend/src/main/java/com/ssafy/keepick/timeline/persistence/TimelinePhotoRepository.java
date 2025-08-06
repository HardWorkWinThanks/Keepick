package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelinePhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TimelinePhotoRepository extends JpaRepository<TimelinePhoto, Long> {

    @Query("""
        SELECT sp
        FROM TimelinePhoto sp
        JOIN FETCH sp.photo p
        WHERE sp.section.id IN :sectionIds
        ORDER BY sp.section.id, sp.sequence
    """)
    List<TimelinePhoto> findPhotosBySectionIds(List<Long> sectionIds);
}
