package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineService {

    private final TimelineAlbumRepository timelineAlbumRepository;

    public List<TimelineAlbumDto> getTimelineAlbumList(Long groupId) {
        return null;
    }

    public TimelineAlbumDto createTimelineAlbum(Long groupId) {
        return null;
    }

    public TimelineAlbumDto getTimelineAlbum(Long albumId) {
        return null;
    }

    public TimelineAlbumDto deleteTimelineAlbum(Long albumId) {
        return null;
    }

    public TimelineAlbumDto updateTimelineAlbum(Long albumId) {
        return null;
    }

}
