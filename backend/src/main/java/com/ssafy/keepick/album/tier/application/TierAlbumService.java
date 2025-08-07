package com.ssafy.keepick.album.tier.application;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.keepick.album.tier.application.dto.TierAlbumDetailDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumListDto;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;
import com.ssafy.keepick.album.tier.domain.Tier;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;
import com.ssafy.keepick.album.tier.persistence.TierAlbumPhotoRepository;
import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.image.domain.Photo;
import com.ssafy.keepick.image.persistence.PhotoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TierAlbumService {
    private final TierAlbumRepository tierAlbumRepository;
    private final TierAlbumPhotoRepository tierAlbumPhotoRepository;
    private final PhotoRepository photoRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    
    // 티어 앨범 생성
    @Transactional
    public TierAlbumDto createTierAlbum(Long groupId, List<Long> photoIds) {
        // 권한 검증
        validateGroupMemberPermission(groupId);
        
        // 빈 티어 앨범 생성
        TierAlbum tierAlbum = TierAlbum.createTierAlbum(groupId);
        TierAlbum savedTierAlbum = tierAlbumRepository.save(tierAlbum);
        
        // 각 사진에 대해 TierAlbumPhoto 관계 생성
        for (int i = 0; i < photoIds.size(); i++) {
            Photo photo = photoRepository.findById(photoIds.get(i))
                .orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));

            TierAlbumPhoto tierAlbumPhoto = TierAlbumPhoto.createTierAlbumPhoto(
                savedTierAlbum, 
                photo, 
                null, // tier는 null (아직 등급이 정해지지 않음)
                i // sequence는 0부터 시작
            );
            tierAlbumPhotoRepository.save(tierAlbumPhoto);
        }
        
        return TierAlbumDto.from(savedTierAlbum);
    }



    // 티어 앨범 목록 조회 (페이징)
    @Transactional(readOnly = true)
    public TierAlbumListDto getTierAlbumListWithPaging(Long groupId, int page, int size) {
        // 권한 검증
        validateGroupMemberPermission(groupId);
        
        // 페이징 계산
        int offset = (page - 1) * size;
        
        // 전체 개수 조회
        long totalElements = tierAlbumRepository.countByGroupId(groupId);
        
        // 페이징된 데이터 조회
        List<TierAlbum> tierAlbums = tierAlbumRepository.findByGroupIdWithPaging(groupId, offset, size);
        List<TierAlbumDto> tierAlbumDtos = tierAlbums.stream().map(TierAlbumDto::from).toList();
        
        return TierAlbumListDto.of(tierAlbumDtos, page, size, totalElements);
    }

    // 티어 앨범 상세 조회 (사진 목록 포함)
    @Transactional(readOnly = true)
    public TierAlbumDetailDto getTierAlbumDetail(Long groupId, Long tierAlbumId) {
        // 권한 검증
        validateGroupMemberPermission(groupId);
        
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        
        // 앨범이 해당 그룹에 속하는지 검증
        validateAlbumBelongsToGroup(tierAlbum, groupId);
        
        return TierAlbumDetailDto.from(tierAlbum);
    }

    // 티어 앨범 수정
    @Transactional
    public TierAlbumDto updateTierAlbum(Long groupId, Long tierAlbumId, UpdateTierAlbumRequest request) {
        // 권한 검증
        validateGroupMemberPermission(groupId);
        
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        
        // 앨범이 해당 그룹에 속하는지 검증
        validateAlbumBelongsToGroup(tierAlbum, groupId);
        
        // thumbnailId로 Photo 조회하여 URL 정보 가져오기
        String thumbnailUrl = null;
        String originalUrl = null;
        if (request.getThumbnailId() != null) {
            Photo thumbnailPhoto = photoRepository.findById(request.getThumbnailId())
                .orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));
            
            // 썸네일로 지정할 사진이 해당 앨범에 포함되어 있는지 검증
            boolean isPhotoInAlbum = tierAlbum.getAllPhotos().stream()
                .anyMatch(albumPhoto -> albumPhoto.getPhoto().getId().equals(request.getThumbnailId()));
            
            if (!isPhotoInAlbum) {
                throw new BaseException(ErrorCode.INVALID_PARAMETER);
            }
            
            thumbnailUrl = thumbnailPhoto.getThumbnailUrl();
            originalUrl = thumbnailPhoto.getOriginalUrl();
        }
        
        // 앨범 기본 정보 업데이트
        tierAlbum.update(request.getName(), request.getDescription(), thumbnailUrl, originalUrl);
        
        // 티어별 사진 등급 업데이트
        if (request.getPhotos() != null) {
            Long albumId = tierAlbum.getId();
            
            // 1. 앨범에 포함된 모든 사진 ID 수집
            List<Long> allAlbumPhotoIds = tierAlbum.getAllPhotos().stream()
                .map(albumPhoto -> albumPhoto.getPhoto().getId())
                .toList();
            
            // 2. 요청에서 모든 사진 ID들 수집
            List<Long> allRequestedPhotoIds = request.getPhotos().values().stream()
                .flatMap(List::stream)
                .toList();
            
            // 3. 요청에 포함되지 않은 사진이 있는지 검증
            List<Long> missingPhotoIds = allAlbumPhotoIds.stream()
                .filter(photoId -> !allRequestedPhotoIds.contains(photoId))
                .toList();
            
            if (!missingPhotoIds.isEmpty()) {
                throw new BaseException(ErrorCode.INVALID_PARAMETER);
            }
            
            // 4. 요청에 앨범에 없는 사진이 있는지 검증
            List<Long> invalidPhotoIds = allRequestedPhotoIds.stream()
                .filter(photoId -> !allAlbumPhotoIds.contains(photoId))
                .toList();
            
            if (!invalidPhotoIds.isEmpty()) {
                throw new BaseException(ErrorCode.INVALID_PARAMETER);
            }
            
            // 5. 모든 사진을 먼저 null로 초기화
            tierAlbumPhotoRepository.resetAllTiersByAlbumId(albumId);
            
            // 6. 각 티어별로 sequence 업데이트 및 티어 설정
            for (Map.Entry<String, List<Long>> entry : request.getPhotos().entrySet()) {
                String tierName = entry.getKey();
                List<Long> photoIds = entry.getValue();
                
                if (photoIds != null && !photoIds.isEmpty()) {
                    // 각 티어 내에서 sequence 순서대로 업데이트
                    for (int i = 0; i < photoIds.size(); i++) {
                        Long photoId = photoIds.get(i);
                        if ("UNASSIGNED".equals(tierName)) {
                            tierAlbumPhotoRepository.updateTierAndSequenceByPhotoId(albumId, photoId, null, i);
                        } else {
                            Tier tier = Tier.valueOf(tierName);
                            tierAlbumPhotoRepository.updateTierAndSequenceByPhotoId(albumId, photoId, tier, i);
                        }
                    }
                }
            }
            
            // 7. photoCount 업데이트 - 앨범에 포함된 모든 사진 개수로 계산
            tierAlbum.updatePhotoCount(allAlbumPhotoIds.size());
            
            // 업데이트된 앨범을 반환
            return TierAlbumDto.from(tierAlbum);
        }
        
        return TierAlbumDto.from(tierAlbum);
    }

    // 티어 앨범 삭제
    @Transactional
    public void deleteTierAlbum(Long groupId, Long tierAlbumId) {
        // 권한 검증
        validateGroupMemberPermission(groupId);
        
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        
        // 앨범이 해당 그룹에 속하는지 검증
        validateAlbumBelongsToGroup(tierAlbum, groupId);
        
        tierAlbum.delete();
    }
    
    /**
     * 그룹 멤버 권한 검증
     * 
     * @param groupId 그룹 ID
     * @throws BaseException 그룹이 존재하지 않거나 권한이 없는 경우
     */
    private void validateGroupMemberPermission(Long groupId) {
        // 그룹 존재 여부 검증
        groupRepository.findById(groupId)
                .orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));

        // 권한 검증 - 현재 사용자가 그룹 멤버인지 확인
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        if (!groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId,
                GroupMemberStatus.ACCEPTED)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
    }

    /**
     * 앨범이 해당 그룹에 속하는지 검증
     * 
     * @param tierAlbum 앨범 엔티티
     * @param groupId   그룹 ID
     * @throws BaseException 앨범이 다른 그룹에 속한 경우
     */
    private void validateAlbumBelongsToGroup(TierAlbum tierAlbum, Long groupId) {
        if (!tierAlbum.getGroupId().equals(groupId)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
    }
}
