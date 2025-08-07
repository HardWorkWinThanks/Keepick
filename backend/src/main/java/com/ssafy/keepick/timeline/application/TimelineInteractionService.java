package com.ssafy.keepick.timeline.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumPhotoDto;
import com.ssafy.keepick.timeline.controller.request.TimelineCreateRequest;
import com.ssafy.keepick.timeline.controller.request.TimelineUpdateRequest;
import com.ssafy.keepick.timeline.controller.request.TimelineUploadRequest;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumPhotoRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional
public class TimelineInteractionService {

    private final TimelineAlbumRepository timelineAlbumRepository;
    private final TimelineAlbumSectionRepository timelineAlbumSectionRepository;
    private final TimelineAlbumPhotoRepository timelineAlbumPhotoRepository;
    private final GroupRepository groupRepository;
    private final PhotoRepository photoRepository;

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

    public void deleteTimelineAlbum(Long groupId, Long albumId) {
        TimelineAlbum album = timelineAlbumRepository.findAlbumByIdAndDeletedAtIsNull(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        if (!Objects.equals(groupId, album.getGroup().getId())) {
            throw new BaseException(ErrorCode.ALBUM_FORBIDDEN);
        }
        album.delete();
    }

    public TimelineAlbumDto updateTimelineAlbum(Long albumId, TimelineUpdateRequest request) {
        // 수정할 앨범 조회
        TimelineAlbum album = timelineAlbumRepository.findAlbumWithSectionsByIdAndDeletedAtIsNull(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        // 앨범 수정
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

        Photo thumbnail = null;
        if (thumbnailId != null) {
            thumbnail = photoRepository.findById(thumbnailId).orElseThrow(() -> new BaseException(ErrorCode.PHOTO_NOT_FOUND));
        }

        // 앨범 기본 정보 수정
        album.update(name, description, thumbnail, startDate, endDate);

        // 앨범에서 삭제할 사진 처리
        deleteRemovedPhotos(album, request.getDeletedPhotoIds());

        // 사용하지 않은 사진 처리
        updateUnusedPhotos(album, request.getUnusedPhotoIds());

        // 요청에 없는 섹션은 삭제
        deleteRemovedSections(album, request.getSections());

        // 앨범 섹션 수정
        IntStream.range(0, request.getSections().size())
                .forEach(i -> updateTimelineSection(album, request.getSections().get(i), i + 1));

    }

    private void deleteRemovedPhotos(TimelineAlbum album, List<Long> photoIds) {
        // 타임라앤 앨범에서 사진 조회
        List<TimelineAlbumPhoto> photos = timelineAlbumPhotoRepository.findAllByPhotoIdIn(album.getId(), photoIds);
        photos.forEach(photo -> {
            // 섹션에서 사진 삭제
            Optional.ofNullable(photo.getSection())
                    .ifPresent(section -> section.deletePhoto(photo));
            // 앨범에서 사진 삭제
            album.deletePhoto(photo);
        });
    }

    private void updateTimelineSection(TimelineAlbum album, TimelineUpdateRequest.SectionUpdateRequest request, int sequence) {

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
        section.updateSequence(sequence);

        // 섹션 내 사진 수정
        updateTimelineSectionPhotos(album.getId(), section, request);
    }

    private void updateTimelineSectionPhotos(Long albumId, TimelineAlbumSection section, TimelineUpdateRequest.SectionUpdateRequest request) {
        List<Long> photoIds = request.getPhotoIds();
        int photoCount = photoIds.size();

        for (int i = 0; i < photoCount; i++) {
            TimelineAlbumPhoto photo = timelineAlbumPhotoRepository.findByAlbumIdAndPhotoIdAndDeletedAtIsNull(albumId, photoIds.get(i)).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_PHOTO_NOT_FOUND));

            // 기존에 다른 섹션에 속해 있던 경우는 photo를 기존 섹션에서 제거하고 해당 섹션에 추가
            TimelineAlbumSection oldSection = photo.getSection();
            if(oldSection != section) {
                if (oldSection != null) {
                    section.deletePhoto(photo);
                }
                section.addPhoto(photo);
            }

            // 섹션 내 사진 순서 변경
            photo.updateSequence(i + 1);
        }
    }

    private void updateUnusedPhotos(TimelineAlbum album, List<Long> photoIds) {
        // 섹션에 사용하지 않는 사진은 기존 섹션에서 제거
        for (Long photoId : photoIds) {
            TimelineAlbumPhoto photo = timelineAlbumPhotoRepository.findByAlbumIdAndPhotoIdAndDeletedAtIsNull(album.getId(), photoId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_PHOTO_NOT_FOUND));
            TimelineAlbumSection section = photo.getSection();
            if (section != null) {
                section.deletePhoto(photo);
            }
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

    public List<TimelineAlbumPhotoDto> addPhotoToTimelineAlbum(Long albumId, TimelineUploadRequest request) {
        TimelineAlbum album = timelineAlbumRepository.findAlbumByIdAndDeletedAtIsNull(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        // 앨범에 포함되지 않은 사진만 앨범에 추가
        List<Photo> photos = timelineAlbumPhotoRepository.findNotInAlbumByPhotoIds(albumId, request.getPhotoIds());
        photos.forEach(p -> System.out.println("p.getId() = " + p.getId()));
        
        // 타임라인 앨범에 사진 추가
        List<TimelineAlbumPhoto> timelineAlbumPhotos = photos.stream().map(album::addPhoto).toList();

        List<TimelineAlbumPhotoDto> timelineAlbumPhotoDtos = timelineAlbumPhotos.stream().map(TimelineAlbumPhotoDto::from).toList();
        return timelineAlbumPhotoDtos;
    }
}
