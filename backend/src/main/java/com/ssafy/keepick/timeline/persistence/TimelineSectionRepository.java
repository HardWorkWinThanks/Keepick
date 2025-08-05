package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineSection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimelineSectionRepository extends JpaRepository<TimelineSection, Long> {
}
