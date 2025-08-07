package com.ssafy.keepick.album.tier.application;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.image.domain.Photo;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDetailDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumListDto;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;
import com.ssafy.keepick.album.tier.persistence.TierAlbumPhotoRepository;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;
import com.ssafy.keepick.image.persistence.PhotoRepository;
import com.ssafy.keepick.album.tier.domain.Tier;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;

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
        // 그룹 존재 여부 검증
        groupRepository.findById(groupId)
                .orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));
        
        // 권한 검증 - 현재 사용자가 그룹 멤버인지 확인
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        if (!groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        
        // 빈 티어 앨범 생성
        TierAlbum tierAlbum = TierAlbum.createTierAlbum(null, null, null, null, groupId);
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
        // 그룹 존재 여부 검증
        groupRepository.findById(groupId)
                .orElseThrow(() -> new BaseException(ErrorCode.GROUP_NOT_FOUND));
        
        // 권한 검증 - 현재 사용자가 그룹 멤버인지 확인
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        if (!groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        
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
    public TierAlbumDetailDto getTierAlbumDetail(Long tierAlbumId) {
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        
        // 권한 검증 - 현재 사용자가 앨범이 속한 그룹의 멤버인지 확인
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        if (!groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(tierAlbum.getGroupId(), currentUserId, GroupMemberStatus.ACCEPTED)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        
        return TierAlbumDetailDto.from(tierAlbum);
    }

    // 티어 앨범 수정
    @Transactional
    public TierAlbumDto updateTierAlbum(Long tierAlbumId, UpdateTierAlbumRequest request) {
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        
        // 권한 검증 - 현재 사용자가 앨범이 속한 그룹의 멤버인지 확인
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        if (!groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(tierAlbum.getGroupId(), currentUserId, GroupMemberStatus.ACCEPTED)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        
        // thumbnailId로 Photo 조회하여 URL 정보 가져오기
        String thumbnailUrl = null;
        String originalUrl = null;
        if (request.getThumbnailId() != null) {
            Photo thumbnailPhoto = photoRepository.findById(request.getThumbnailId())
                .orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));
            thumbnailUrl = thumbnailPhoto.getThumbnailUrl();
            originalUrl = thumbnailPhoto.getOriginalUrl();
        }
        
        // 앨범 기본 정보 업데이트
        tierAlbum.update(request.getName(), request.getDescription(), thumbnailUrl, originalUrl);
        
        // 티어별 사진 등급 업데이트
        if (request.getPhotos() != null) {
            Long albumId = tierAlbum.getId();
            
            // 1. 요청되지 않은 사진들을 제외 상태로 설정
            List<Long> allRequestedPhotoIds = request.getPhotos().values().stream()
                .flatMap(List::stream)
                .toList();
            
            tierAlbumPhotoRepository.excludePhotosNotInList(albumId, allRequestedPhotoIds);
            
            // 2. 티어별로 사진 등급 설정
            request.getPhotos().forEach((tierName, photoIds) -> {
                if (photoIds != null && !photoIds.isEmpty()) {
                    Tier tier = Tier.valueOf(tierName);
                    tierAlbumPhotoRepository.updateTiersByPhotoIds(albumId, tier, photoIds);
                }
            });
            
            // 3. photoCount 업데이트를 위해 앨범 다시 조회
            TierAlbum updatedAlbum = tierAlbumRepository.findAlbumWithPhotosById(albumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
            
            long includedPhotoCount = updatedAlbum.getAllPhotos().stream()
                .filter(photo -> photo.getTier() != null)
                .count();
            updatedAlbum.updatePhotoCount((int) includedPhotoCount);
        }
        
        return TierAlbumDto.from(tierAlbum);
    }

    // 티어 앨범 삭제
    @Transactional
    public void deleteTierAlbum(Long tierAlbumId) {
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        
        // 권한 검증 - 현재 사용자가 앨범이 속한 그룹의 멤버인지 확인
        Long currentUserId = AuthenticationUtil.getCurrentUserId();
        if (!groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(tierAlbum.getGroupId(), currentUserId, GroupMemberStatus.ACCEPTED)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        
        tierAlbum.delete();
    }
}
