package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineSection;
import com.ssafy.keepick.timeline.domain.TimelinePhoto;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelinePhotoRepository;
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
    private final TimelinePhotoRepository timelinePhotoRepository;

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

        // 섹션별 사진 조회
        List<TimelineSection> sections = timelineAlbum.getSections();
        Map<Long, List<TimelinePhoto>> photosBySection = fetchPhotosBySection(sections);
        
        // 섹션별 사진 매핑
        sections.forEach(section -> {
            section.loadPhotos(photosBySection.getOrDefault(section.getId(), List.of()));
        });
        
        // DTO 변환
        TimelineAlbumDto timelineAlbumDto = TimelineAlbumDto.from(timelineAlbum, timelineAlbum.getSections());
        return timelineAlbumDto;
    }

    private Map<Long, List<TimelinePhoto>> fetchPhotosBySection(List<TimelineSection> sections) {
        // 앨범의 섹션 ID로 사진 조회
        List<Long> sectionIds = sections.stream().map(TimelineSection::getId).toList();
        List<TimelinePhoto> photos = timelinePhotoRepository.findPhotosBySectionIds(sectionIds);

        // 섹션 ID를 기준으로 사진 그룹핑
        Map<Long, List<TimelinePhoto>> photosBySection = photos.stream()
                .collect(Collectors.groupingBy(
                        photo -> photo.getSection().getId(),
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
