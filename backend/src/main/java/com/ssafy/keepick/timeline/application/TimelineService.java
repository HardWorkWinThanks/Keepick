package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumPhotoRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineService {

    private final TimelineAlbumRepository timelineAlbumRepository;
    private final TimelineAlbumSectionRepository timelineAlbumSectionRepository;
    private final TimelineAlbumPhotoRepository timelineAlbumPhotoRepository;

    public Page<TimelineAlbumDto> getTimelineAlbumList(Long groupId, Integer page, Integer size) {
        Page<TimelineAlbum> albumPage = timelineAlbumRepository.findAllByGroupIdAndDeletedAtIsNull(groupId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        Page<TimelineAlbumDto> albumDtoPage = albumPage.map(TimelineAlbumDto::from);
        return albumDtoPage;
    }

    public TimelineAlbumDto getTimelineAlbum(Long groupId, Long albumId) {
        // 앨범 조회
        TimelineAlbum album = timelineAlbumRepository.findAlbumByIdAndDeletedAtIsNull(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        // 앨범 섹션 조회
        List<TimelineAlbumSection> sections = timelineAlbumSectionRepository.findAllByAlbumId(albumId);
        album.loadSections(sections);

        // 섹션에 포함되지 않은 사진
        List<TimelineAlbumPhoto> photos = timelineAlbumPhotoRepository.findUnusedPhotosByAlbumIdAndSectionIsNull(albumId);
        album.loadPhotos(photos);

        // DTO 변환
        TimelineAlbumDto albumDto = TimelineAlbumDto.fromDetail(album);
        return albumDto;
    }

}
