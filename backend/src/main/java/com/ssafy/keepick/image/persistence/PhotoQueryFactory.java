package com.ssafy.keepick.image.persistence;

import com.ssafy.keepick.image.domain.Photo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface PhotoQueryFactory {
    Page<Photo> findAllPhotosByGroupIdAndOption(Pageable pageable,
                                                Long groupId,
                                                List<Long> memberIds,
                                                List<String> tags,
                                                LocalDate startDate,
                                                LocalDate endDate);
}
