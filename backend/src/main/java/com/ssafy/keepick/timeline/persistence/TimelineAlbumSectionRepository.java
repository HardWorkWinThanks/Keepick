package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimelineAlbumSectionRepository extends JpaRepository<TimelineAlbumSection, Long> {
}
