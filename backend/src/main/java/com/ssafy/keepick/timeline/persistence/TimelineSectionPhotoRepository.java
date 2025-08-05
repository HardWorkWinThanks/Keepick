package com.ssafy.keepick.timeline.persistence;

import com.ssafy.keepick.timeline.domain.TimelineSectionPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimelineSectionPhotoRepository extends JpaRepository<TimelineSectionPhoto, Long> {
}
