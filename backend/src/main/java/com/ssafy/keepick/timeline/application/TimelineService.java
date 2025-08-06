package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.image.domain.Photo;
import com.ssafy.keepick.image.persistence.PhotoRepository;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.controller.request.TimelineCreateRequest;
import com.ssafy.keepick.timeline.controller.request.TimelineUpdateRequest;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumPhotoRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumSectionRepository;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineService {

    private final TimelineAlbumRepository timelineAlbumRepository;
    private final TimelineAlbumSectionRepository timelineAlbumSectionRepository;
    private final TimelineAlbumPhotoRepository timelineAlbumPhotoRepository;
    private final GroupRepository groupRepository;
    private final PhotoRepository photoRepository;

    public Page<TimelineAlbumDto> getTimelineAlbumList(Long groupId, Integer page, Integer size) {
        Page<TimelineAlbum> albumPage = timelineAlbumRepository.findAllByGroupIdAndDeletedAtIsNull(groupId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        Page<TimelineAlbumDto> albumDtoPage = albumPage.map(TimelineAlbumDto::from);
        return albumDtoPage;
    }

    public TimelineAlbumDto createTimelineAlbum(Long groupId, TimelineCreateRequest request) {
        // 그룹 & 사진 조회
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));
        List<Photo> photos = photoRepository.findAllById(request.getPhotoIds());
        
        // 타임라인 앨범 생성
        TimelineAlbum album = TimelineAlbum.createTimelineAlbum(group, photos);
        timelineAlbumRepository.save(album);

        TimelineAlbumDto albumDto = TimelineAlbumDto.from(album);
        return albumDto;
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
        List<TimelineAlbumPhoto> photos = timelineAlbumPhotoRepository.findPhotosByAlbumId(albumId);

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

    public TimelineAlbumDto updateTimelineAlbum(Long albumId, TimelineUpdateRequest request) {
        // 수정할 앨범 조회
        TimelineAlbum album = timelineAlbumRepository.findAlbumById(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        // 앨범 기본 정보 수정
        updateTimelineAlbumInfo(album, request);

        TimelineAlbumDto albumDto = TimelineAlbumDto.from(album);
        return albumDto;
    }

    private void updateTimelineAlbumInfo(TimelineAlbum album, TimelineUpdateRequest request) {
        // 앨범 기본 정보
        String name = request.getName();
        String description = request.getDescription();
        Long thumbnailId = request.getThumbnailId();
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        Photo thumbnail = photoRepository.findById(thumbnailId).orElseThrow(() -> new BaseException(ErrorCode.PHOTO_NOT_FOUND));

        // 앨범 기본 정보 수정
        album.update(name, description, thumbnail, startDate, endDate);

        // 앨범 섹션 수정
        List<TimelineUpdateRequest.SectionUpdateRequest> sectionUpdateRequests = request.getSections();
        for (var sectionUpdateRequest : sectionUpdateRequests) {
            updateTimelineSection(album, sectionUpdateRequest);
        }

        // 요청에 없는 섹션은 삭제
        deleteRemovedSections(album, request.getSections());

        // 섹션에 사용하지 않는 사진은 기존 섹션에서 제거
        updateUnusedPhotos(request.getPhotoIds());
    }

    private void updateTimelineSection(TimelineAlbum album, TimelineUpdateRequest.SectionUpdateRequest request) {

        TimelineAlbumSection section = null;

        if (request.getId() != null) {
            section = timelineAlbumSectionRepository.findById(request.getId()).orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));
        } else {
            // 새로운 섹션 생성
            section = album.createTimelineAlbumSection();
        }

        // 섹션 기본 정보 수정
        String name = request.getName();
        String description = request.getDescription();
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        section.update(name, description, startDate, endDate);

        // 섹션 내 사진 수정
        updateTimelineSectionPhotos(section, request);
    }

    private void updateTimelineSectionPhotos(TimelineAlbumSection section, TimelineUpdateRequest.SectionUpdateRequest request) {
        List<Long> photoIds = request.getPhotoIds();
        int photoCount = photoIds.size();

        for (int i = 0; i < photoCount; i++) {
            TimelineAlbumPhoto photo = timelineAlbumPhotoRepository.findByPhotoId(photoIds.get(i)).orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));
            photo.updateSequence(i + 1);

            // 기존에 다른 섹션에 속해 있던 경우는 기존 섹션에서 제거
            if(section != photo.getSection()) {
                section.deletePhoto(photo);
            }
            // 각 섹션의 photoIds에 속한 photo를 해당 섹션에 추가
            section.addPhoto(photo);
        }
    }

    private void updateUnusedPhotos(List<Long> photoIds) {
        for (Long photoId : photoIds) {
            TimelineAlbumPhoto photo = timelineAlbumPhotoRepository.findByPhotoId(photoId).orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));
            photo.getSection().deletePhoto(photo);
        }
    }

    private void deleteRemovedSections(TimelineAlbum album, List<TimelineUpdateRequest.SectionUpdateRequest> request) {
        List<Long> requestedSectionIds = request.stream().map(TimelineUpdateRequest.SectionUpdateRequest::getId).filter(Objects::nonNull).toList();

        List<TimelineAlbumSection> existingSections = album.getSections();
        List<TimelineAlbumSection> notRequestedSections = existingSections.stream().filter(section -> !requestedSectionIds.contains(section.getId())).toList();

        for (TimelineAlbumSection section : notRequestedSections) {
            album.deleteSection(section);
        }
    }

}
