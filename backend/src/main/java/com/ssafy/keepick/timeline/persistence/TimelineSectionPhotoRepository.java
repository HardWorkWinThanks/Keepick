package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineSectionPhoto;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TimelineSectionPhotoRepository extends JpaRepository<TimelineSectionPhoto, Long> {

    @Query("""
        SELECT sp
        FROM TimelineSectionPhoto sp
        JOIN FETCH sp.photo p
        WHERE sp.section.id IN :sectionIds
        ORDER BY sp.section.id, sp.sequence
    """)
    List<TimelineSectionPhoto> findPhotosBySectionIds(List<Long> sectionIds);
}
