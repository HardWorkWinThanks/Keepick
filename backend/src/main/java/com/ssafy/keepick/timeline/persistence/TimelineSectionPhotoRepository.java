package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineSectionPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TimelineSectionPhotoRepository extends JpaRepository<TimelineSectionPhoto, Long> {

    @Query("""
        select sp
        from TimelineSectionPhoto sp
        join fetch sp.photo p
        where sp.section.id in :sectionIds
        order by sp.section.id, sp.sequence
    """)
    List<TimelineSectionPhoto> findPhotosBySectionIds(List<Long> sectionIds);
}
