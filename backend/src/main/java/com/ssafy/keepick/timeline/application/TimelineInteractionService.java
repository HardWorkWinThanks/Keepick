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
import com.ssafy.keepick.timeline.controller.request.TimelinePhotoRequest;
import com.ssafy.keepick.timeline.controller.request.TimelineUpdateRequest;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumPhotoRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumRepository;
import com.ssafy.keepick.timeline.persistence.TimelineAlbumSectionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineInteractionService {

    private final TimelineAlbumRepository timelineAlbumRepository;
    private final TimelineAlbumSectionRepository timelineAlbumSectionRepository;
    private final TimelineAlbumPhotoRepository timelineAlbumPhotoRepository;
    private final GroupRepository groupRepository;
    private final PhotoRepository photoRepository;

    @Transactional
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

    @Transactional
    public void deleteTimelineAlbum(Long groupId, Long albumId) {
        TimelineAlbum album = timelineAlbumRepository.findAlbumByIdAndDeletedAtIsNull(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        if (!Objects.equals(groupId, album.getGroup().getId())) {
            throw new BaseException(ErrorCode.ALBUM_FORBIDDEN);
        }
        album.delete();
    }

    @Transactional
    public TimelineAlbumDto updateTimelineAlbum(Long groupId, Long albumId, TimelineUpdateRequest request) {
        // 수정할 앨범 조회
        TimelineAlbum album = timelineAlbumRepository.findAlbumWithSectionsByIdAndDeletedAtIsNull(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        // 앨범 수정
        updateTimelineAlbumInfo(album, request);

        TimelineAlbumDto albumDto = TimelineAlbumDto.from(album);
        return albumDto;
    }

    private void updateTimelineAlbumInfo(TimelineAlbum album, TimelineUpdateRequest request) {
        Photo thumbnail = null;
        if (request.getThumbnailId() != null) {
            thumbnail = photoRepository.findById(request.getThumbnailId()).orElseThrow(() -> new BaseException(ErrorCode.PHOTO_NOT_FOUND));
        }

        // 앨범 기본 정보 수정
        album.update(request.getName(), request.getDescription(), thumbnail, request.getStartDate(), request.getEndDate());

        // 사용하지 않은 사진 처리
        updateUnusedPhotos(album, request.getSections());

        // 요청에 없는 섹션은 삭제
        updateRemovedSections(album, request.getSections());

        // 앨범 섹션 수정
        IntStream.range(0, request.getSections().size())
                .forEach(i -> updateTimelineSection(album, request.getSections().get(i), i));

    }


    private void updateTimelineSection(TimelineAlbum album, TimelineUpdateRequest.SectionUpdateRequest request, int sequence) {

        TimelineAlbumSection section = null;

        if (request.getId() != null) { // 기존 섹션 조회
            section = album.getSections().stream().filter(albumSection -> Objects.equals(albumSection.getId(), request.getId())).findFirst().orElseThrow(() -> new BaseException(ErrorCode.INVALID_PARAMETER));
        } else { // 새로운 섹션 생성
            section = album.createTimelineAlbumSection();
        }

        // 섹션 기본 정보 수정
        section.update(request.getName(), request.getDescription(), request.getStartDate(), request.getEndDate());
        section.updateSequence(sequence);

        // 섹션 내 사진 수정
        updateTimelineSectionPhotos(album.getId(), section, request.getPhotoIds());
    }

    private void updateTimelineSectionPhotos(Long albumId, TimelineAlbumSection section, List<Long> photoIds) {
        // 앨범에서 섹션에 포함된 사진 조회
        List<TimelineAlbumPhoto> photos = timelineAlbumPhotoRepository.findAllByAlbumIdAndPhotoIdIn(albumId, photoIds);
        Map<Long, TimelineAlbumPhoto> photoMap = photos.stream()
                .collect(Collectors.toMap(photo -> photo.getPhoto().getId(), Function.identity()));

        for (int i = 0; i < photoIds.size(); i++) {
            Long photoId = photoIds.get(i);
            TimelineAlbumPhoto photo = photoMap.get(photoId);
            if (photo == null) {
                throw new BaseException(ErrorCode.ALBUM_PHOTO_NOT_FOUND);
            }

            // 기존에 다른 섹션에 속해 있던 경우는 photo를 기존 섹션에서 제거하고 해당 섹션에 추가
            TimelineAlbumSection oldSection = photo.getSection();
            if (oldSection != section) {
                if (oldSection != null) {
                    oldSection.removePhoto(photo);
                }
                section.addPhoto(photo);
            }

            // 섹션 내 사진 순서 변경
            photo.updateSequence(i);
        }
    }

    private void updateUnusedPhotos(TimelineAlbum album, List<TimelineUpdateRequest.SectionUpdateRequest> request) {
        // 사용하지 않는 사진을 따로 받지 않고 완성된 앨범만 받아서 사용되지 않은 사진은 자동 처리
        Set<Long> requestedPhotoIds = request.stream()
                .flatMap(section -> section.getPhotoIds().stream())
                .collect(Collectors.toSet());

        // 기존 albumPhotos 전부 조회
        List<TimelineAlbumPhoto> photos = timelineAlbumPhotoRepository.findAllByAlbumId(album.getId());

        // 제거 대상 필터링
        List<TimelineAlbumPhoto> removedPhotos = photos.stream()
                .filter(albumPhoto -> !requestedPhotoIds.contains(albumPhoto.getPhoto().getId()))
                .collect(Collectors.toList());

        removedPhotos.forEach(albumPhoto -> {
            TimelineAlbumSection section = albumPhoto.getSection();
            if(section != null) {
                section.removePhoto(albumPhoto); // 섹션에서 사진 제거하면 앨범에만 포함된 상태
            }
        });

    }

    private void updateRemovedSections(TimelineAlbum album, List<TimelineUpdateRequest.SectionUpdateRequest> requests) {
        // 요청에 포함된 섹션
        Set<Long> requestedIds = requests.stream()
                .map(TimelineUpdateRequest.SectionUpdateRequest::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 요청에 포함되지 않은 섹션
        List<TimelineAlbumSection> removedSections = album.getSections().stream()
                .filter(section -> !requestedIds.contains(section.getId()))
                .collect(Collectors.toList());

        removedSections.forEach(album::removeSection); // 앨범에서 섹션 제거
        timelineAlbumSectionRepository.deleteAll(removedSections); // DB에서 섹션 삭제
    }

    @Transactional
    public List<TimelineAlbumPhotoDto> addPhotoToTimelineAlbum(Long groupId, Long albumId, TimelinePhotoRequest request) {
        TimelineAlbum album = timelineAlbumRepository.findAlbumByIdAndDeletedAtIsNull(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        // 앨범에 포함되지 않은 사진만 앨범에 추가
        List<Photo> photos = timelineAlbumPhotoRepository.findNotInAlbumByPhotoIds(albumId, request.getPhotoIds());

        // 타임라인 앨범에 사진 추가
        List<TimelineAlbumPhoto> timelineAlbumPhotos = photos.stream().map(album::addPhoto).toList();

        List<TimelineAlbumPhotoDto> timelineAlbumPhotoDtos = timelineAlbumPhotos.stream().map(TimelineAlbumPhotoDto::from).toList();
        return timelineAlbumPhotoDtos;
    }

    @Transactional
    public void deletePhotoFromTimelineAlbum(Long groupId, Long albumId, @Valid TimelinePhotoRequest request) {
        timelineAlbumRepository.findAlbumByIdAndDeletedAtIsNull(albumId).orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        // 삭제할 사진을 조회하고 삭제
        List<TimelineAlbumPhoto> photos = timelineAlbumPhotoRepository.findAllByAlbumIdAndPhotoIdIn(albumId, request.getPhotoIds());
        // 섹션에서 사진 제거
        photos.stream()
                .filter(photo -> photo.getSection() != null)
                .forEach(photo -> photo.getSection().removePhoto(photo));
        timelineAlbumPhotoRepository.deleteAll(photos); // DB에서 사진 삭제
    }

}
