package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.application.dto.TimelineSectionDto;
import com.ssafy.keepick.timeline.application.dto.TimelineSectionPhotoDto;
import com.ssafy.keepick.timeline.controller.response.TimelineDetailResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;

@Sql("/timeline-data.sql")
@Import({
        TimelineService.class
})
@DataJpaTest
class TimelineServicePrintTest {

    @Autowired TimelineService timelineService;

    @DisplayName("타임라인 앨범 상세 조회 결과 출력")
    @Test
    void getTimelineAlbum() {

        TimelineAlbumDto dto = timelineService.getTimelineAlbum(1L);

        System.out.println("album =" + dto.getTimelineAlbumId() + " " + dto.getName());

        List<TimelineSectionDto> sections = dto.getSections();
        for (var section : sections) {
            System.out.println("section = " + section.getSequence() + " " + section.getName());

            List<TimelineSectionPhotoDto> photos = section.getPhotos();
            for (var photo : photos) {
                System.out.println("photo = " + photo.getSequence() + " " + photo.getOriginalUrl());
            }
        }

    }

    @DisplayName("타임라인 앨범 상세 조회 결과 응답 DTO 출력")
    @Test
    void getTimelineAlbumToResponse() {

        TimelineAlbumDto dto = timelineService.getTimelineAlbum(1L);
        TimelineDetailResponse response = TimelineDetailResponse.toResponse(dto);

        System.out.println("response = " + response);

    }
}