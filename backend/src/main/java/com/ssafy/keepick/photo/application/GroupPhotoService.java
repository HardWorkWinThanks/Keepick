package com.ssafy.keepick.photo.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.application.dto.GroupPhotoCommandDto;
import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import com.ssafy.keepick.photo.controller.request.GroupPhotoDeleteRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoSearchRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoUploadRequest;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class GroupPhotoService {
    private final GroupRepository groupRepository;
    private final PhotoRepository photoRepository;
    private final ImageService imageService;


    @Transactional
    public List<String> uploadGroupPhoto(Long groupId, GroupPhotoUploadRequest request) {
        // 1. 그룹 확인
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));

        if (request.getFiles().isEmpty()) {
            return Collections.emptyList();
        }

        // 2. photo 객체 생성 (originalUrl 없이)
        List<Photo> photos = request.getFiles().stream()
                .map(file -> Photo.createPhoto(file.getTakenAt(), file.getWidth(), file.getHeight(), group))
                .collect(Collectors.toList());
        photoRepository.saveAll(photos);

        // 3. 요청 → 커맨드 DTO로 변환 (photoId와 이미지 정보 묶기)
        List<GroupPhotoCommandDto> commandDtos = IntStream.range(0, photos.size())
                .mapToObj(i -> GroupPhotoCommandDto.from(photos.get(i).getId(), request.getFiles().get(i)))
                .collect(Collectors.toList());

        // 4. presigned URL 발급
        List<String> originalUrls = imageService.generatePresignedUrls(commandDtos);

        // 5. originalUrl 세팅 및 상태 변경 (status: UPLOAD)
        IntStream.range(0, photos.size())
                .forEach(i -> photos.get(i).upload(originalUrls.get(i)));
        photoRepository.saveAll(photos); // 변경사항 저장

        return originalUrls;
    }

    @Transactional
    public List<GroupPhotoDto> deleteGroupPhoto(Long groupId, GroupPhotoDeleteRequest request) {
        // 1. 그룹 확인
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));
        // 2. 사진 삭제
        // TODO: 앨범에 포함된 사진인 경우 삭제 건너뛰기
        List<Long> ids = request.getPhotoIds();
        photoRepository.softDeleteAllById(ids);
        return ids.stream().map(GroupPhotoDto::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<GroupPhotoDto> getGroupPhotos(Long groupId, GroupPhotoSearchRequest request) {
        Page<Photo> photoPage = photoRepository.findAllPhotosByGroupIdAndOption(PageRequest.of(request.getPage(), request.getSize()),
                groupId,
                request.getMemberIds(),
                request.getTags(),
                request.getStartDate(),
                request.getEndDate());
        return photoPage.map(GroupPhotoDto::from);
    }

    @Transactional(readOnly = true)
    public List<GroupPhotoDto> getRandomPhotos(Long memberId, int size) {
        int total = photoRepository.countByMemberId(memberId);
        int offset = (int) (Math.random() * Math.max(1, total - size));
        List<Photo> photoList = photoRepository.findRandomByMemberId(memberId, size, offset);
        return photoList.stream().map(GroupPhotoDto::from).collect(Collectors.toList());
    }

}
