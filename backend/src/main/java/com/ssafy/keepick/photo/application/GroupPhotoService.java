package com.ssafy.keepick.photo.application;

import com.ssafy.keepick.external.s3.dto.S3ImagePathDto;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.application.dto.GroupPhotoCommandDto;
import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import com.ssafy.keepick.photo.application.dto.PhotoClusterDto;
import com.ssafy.keepick.photo.application.dto.PhotoTagDto;
import com.ssafy.keepick.photo.controller.request.GroupPhotoDeleteRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoSearchRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoUploadRequest;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.domain.PhotoMember;
import com.ssafy.keepick.photo.domain.PhotoTag;
import com.ssafy.keepick.photo.persistence.PhotoMemberRepository;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.photo.persistence.PhotoTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class GroupPhotoService {
    private final GroupRepository groupRepository;
    private final PhotoRepository photoRepository;
    private final ImageService imageService;
    private final PhotoTagRepository photoTagRepository;
    private final PhotoMemberRepository photoMemberRepository;


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
        List<S3ImagePathDto> imagePathList = imageService.generatePresignedUrls(commandDtos);

        // 5. originalUrl 세팅 및 상태 변경 (status: UPLOAD)
        IntStream.range(0, photos.size())
                .forEach(i -> photos.get(i).upload(imagePathList.get(i).getPublicUrl()));
        photoRepository.saveAll(photos); // 변경사항 저장

        return imagePathList.stream().map(S3ImagePathDto::getPresignedUrl).toList();
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

    @Transactional(readOnly = true)
    public Page<GroupPhotoDto> getBlurryPhotos(Long groupId, int page, int size) {
        Page<Photo> photoPage = photoRepository.findBlurryPhotosByGroupId(groupId, PageRequest.of(page, size));
        return photoPage.map(GroupPhotoDto::from);
    }

    @Transactional(readOnly = true)
    public Page<PhotoClusterDto> getSimilarClusters(Long groupId, int page, int size) {
        // 1. 유사 사진 클러스터 기본 정보(대표 사진ID, 썸네일, 개수) 페이징 조회
        Page<PhotoClusterDto> clusterPage = photoRepository.findSimilarClusters(groupId, PageRequest.of(page, size));

        // 2. 모든 유사 클러스터 clusterId 리스트 추출
        List<Long> clusterIds = clusterPage.stream()
                .map(PhotoClusterDto::getClusterId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (clusterIds.isEmpty()) {
            return clusterPage; // 유사한 사진 클러스터가 없으면 바로 반환
        }

        // 3. clusterId 리스트로 해당 그룹 내 모든 사진 조회
        List<Photo> photoList = photoRepository.findAllByGroupIdAndClusterIdInAndDeletedAtIsNull(groupId, clusterIds);

        // 4. clusterId 기준으로 사진 그룹핑
        Map<Long, List<Photo>> photoListByCluster = photoList.stream().collect(Collectors.groupingBy(Photo::getClusterId));

        // 5. 각 클러스터 DTO에 사진 리스트 매칭
        clusterPage.forEach(cluster -> {
            cluster.setPhotos(photoListByCluster.get(cluster.getClusterId()));
        });

        return clusterPage;
    }

    public PhotoTagDto getGroupPhotoTags(Long groupId, Long photoId) {
        // 그룹 내 사진인지 확인
        if(photoRepository.existsByGroupIdAndPhotoId(groupId, photoId)) {
            throw new BaseException(ErrorCode.PHOTO_NOT_FOUND);
        }

        // 사진 태그, 인식된 회원 조회
        List<PhotoTag> tags = photoTagRepository.findAllByPhotoId(photoId);
        List<PhotoMember> members = photoMemberRepository.findAllByPhotoId(photoId);
        return PhotoTagDto.from(tags, members);
    }
}
