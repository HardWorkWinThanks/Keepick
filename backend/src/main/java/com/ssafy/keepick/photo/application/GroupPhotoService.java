package com.ssafy.keepick.photo.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import com.ssafy.keepick.photo.controller.request.GroupPhotoCreateRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoDeleteRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoSearchRequest;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupPhotoService {
    private final GroupRepository groupRepository;
    private final PhotoRepository photoRepository;

    @Transactional
    public List<GroupPhotoDto> createGroupPhoto(Long groupId, List<GroupPhotoCreateRequest> request) {
        // 1. 그룹 확인
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));
        // 2. 사진 저장
        List<Photo> photoList = request.stream()
                .map(photoRequest -> photoRequest.toEntity(group))
                .toList();
        photoRepository.saveAll(photoList);
        return photoList.stream().map(GroupPhotoDto::from).collect(Collectors.toList());
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
