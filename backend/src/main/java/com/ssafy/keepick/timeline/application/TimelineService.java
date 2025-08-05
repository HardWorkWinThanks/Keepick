package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import lombok.RequiredArgsConstructor;
import lombok.ToString;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@ToString
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineService {

    private final TimelineAlbumRepository timelineAlbumRepository;

    public List<TimelineAlbumDto> getTimelineAlbumList(Long groupId) {
        List<TimelineAlbum> albums = timelineAlbumRepository.findAllByGroupId(groupId);
        List<TimelineAlbumDto> dtos = albums.stream().map(TimelineAlbumDto::from).toList();
        return dtos;
    }

    public TimelineAlbumDto createTimelineAlbum(Long groupId) {
        return null;
    }

    public TimelineAlbumDto getTimelineAlbum(Long albumId) {
        TimelineAlbum timelineAlbum = timelineAlbumRepository.findAlbumById(albumId).orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));
        TimelineAlbumDto dto = TimelineAlbumDto.from(timelineAlbum, timelineAlbum.getSections());
        return dto;
    }

    public TimelineAlbumDto deleteTimelineAlbum(Long albumId) {
        return null;
    }

    public TimelineAlbumDto updateTimelineAlbum(Long albumId) {
        return null;
    }

}
