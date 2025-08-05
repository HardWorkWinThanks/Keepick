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

    public List<TimelineAlbumDto> getTimelineAlbums() {
        return null;
    }

    public TimelineAlbumDto createTimelineAlbum() {
        return null;
    }

    public TimelineAlbumDto getTimelineAlbum() {
        return null;
    }

    public TimelineAlbumDto deleteTimelineAlbum() {
        return null;
    }

    public TimelineAlbumDto updateTimelineAlbum() {
        return null;
    }

}
