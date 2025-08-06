package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumPhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineService {

    private final TimelineAlbumRepository timelineAlbumRepository;
    private final TimelineAlbumPhotoRepository timelinePhotoRepository;

    public List<TimelineAlbumDto> getTimelineAlbumList(Long groupId) {
        List<TimelineAlbum> albums = timelineAlbumRepository.findAllByGroupId(groupId);
        List<TimelineAlbumDto> timelineAlbumDtos = albums.stream().map(TimelineAlbumDto::from).toList();
        return timelineAlbumDtos;
    }

    public TimelineAlbumDto createTimelineAlbum(Long groupId) {
        return null;
    }

    public TimelineAlbumDto getTimelineAlbum(Long albumId) {
        // 앨범 조회
        TimelineAlbum timelineAlbum = timelineAlbumRepository.findAlbumById(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        // 앨범 사진 조회
        Map<Long, List<TimelineAlbumPhoto>> photosBySection = fetchPhotosBySection(albumId);
        
        // 섹션별 사진 매핑
        List<TimelineAlbumSection> sections = timelineAlbum.getSections();
        sections.forEach(section -> {
            section.loadPhotos(photosBySection.getOrDefault(section.getId(), List.of()));
        });

        // 섹션에 포함되지 않은 사진
        List<TimelineAlbumPhoto> photos = photosBySection.get(0L);
        timelineAlbum.loadPhotos(photos);

        // DTO 변환
        TimelineAlbumDto timelineAlbumDto = TimelineAlbumDto.fromDetail(timelineAlbum);
        return timelineAlbumDto;
    }

    private Map<Long, List<TimelineAlbumPhoto>> fetchPhotosBySection(Long albumId) {
        // 앨범의 섹션 ID로 사진 조회
        List<TimelineAlbumPhoto> photos = timelinePhotoRepository.findPhotosByAlbumId(albumId);

        // 섹션 ID를 기준으로 사진 그룹핑
        Map<Long, List<TimelineAlbumPhoto>> photosBySection = photos.stream()
                .collect(Collectors.groupingBy(
                        photo -> photo.getSection() != null ? photo.getSection().getId() : 0L,
                        Collectors.toList()
                ));
        return photosBySection;
    }

    public TimelineAlbumDto deleteTimelineAlbum(Long albumId) {
        return null;
    }

    public TimelineAlbumDto updateTimelineAlbum(Long albumId) {
        return null;
    }

}
