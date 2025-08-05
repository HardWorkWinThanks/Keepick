package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimelineAlbumRepository extends JpaRepository<TimelineAlbum, Long> {
}
