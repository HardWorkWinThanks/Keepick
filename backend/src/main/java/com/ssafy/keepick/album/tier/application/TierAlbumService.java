package com.ssafy.keepick.album.tier.application;

import com.ssafy.keepick.album.tier.application.dto.TierAlbumDetailDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;
import com.ssafy.keepick.album.tier.domain.Tier;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;
import com.ssafy.keepick.album.tier.persistence.TierAlbumPhotoRepository;
import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TierAlbumService {
    
    // 썸네일 정보를 담는 record
    private record ThumbnailInfo(String thumbnailUrl, String originalUrl) {}
    private final TierAlbumRepository tierAlbumRepository;
    private final TierAlbumPhotoRepository tierAlbumPhotoRepository;
    private final PhotoRepository photoRepository;

    
    // 티어 앨범 생성
    @Transactional
    public TierAlbumDto createTierAlbum(Long groupId, List<Long> photoIds) {
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
    public PagingResponse<TierAlbumDto> getTierAlbumListWithPaging(Long groupId, int page, int size) {
        // Pageable 객체 생성 (page는 0부터 시작하므로 -1)
        Pageable pageable = PageRequest.of(page - 1, size);
        
        // 페이징된 데이터 조회
        Page<TierAlbum> tierAlbumPage = tierAlbumRepository.findByGroupIdWithPaging(groupId, pageable);
        
        // PagingResponse.from() 메서드를 사용하여 자동으로 페이징 정보 생성
        return PagingResponse.from(tierAlbumPage, TierAlbumDto::from);
    }

    // 티어 앨범 상세 조회 (사진 목록 포함)
    @Transactional(readOnly = true)
    public TierAlbumDetailDto getTierAlbumDetail(Long groupId, Long tierAlbumId) {
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        return TierAlbumDetailDto.from(tierAlbum);
    }

    // 티어 앨범 수정
    @Transactional
    public TierAlbumDto updateTierAlbum(Long groupId, Long tierAlbumId, UpdateTierAlbumRequest request) {
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        // 썸네일 URL 정보 가져오기
        ThumbnailInfo thumbnailInfo = getThumbnailInfo(request.getThumbnailId(), tierAlbum);
        
        // 앨범 기본 정보 업데이트
        tierAlbum.update(request.getName(), request.getDescription(), 
            thumbnailInfo.thumbnailUrl(), thumbnailInfo.originalUrl());
        
        // 티어별 사진 등급 업데이트가 없는 경우 바로 반환
        if (request.getPhotos() == null) {
            return TierAlbumDto.from(tierAlbum);
        }
        
        // 사진 ID 검증 및 티어별 사진 업데이트
        validateAndUpdateTierPhotos(tierAlbum, request.getPhotos());
        
        return TierAlbumDto.from(tierAlbum);
    }

    // 티어 앨범 삭제
    @Transactional
    public void deleteTierAlbum(Long groupId, Long tierAlbumId) {
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));

        tierAlbum.delete();
    }
    
    /**
     * 썸네일 정보를 가져오는 메서드
     * 
     * @param thumbnailId 썸네일로 지정할 사진 ID
     * @param tierAlbum 앨범 엔티티
     * @return ThumbnailInfo 썸네일 정보
     * @throws BaseException 썸네일 사진이 존재하지 않거나 앨범에 포함되지 않은 경우
     */
    private ThumbnailInfo getThumbnailInfo(Long thumbnailId, TierAlbum tierAlbum) {
        if (thumbnailId == null) {
            return new ThumbnailInfo(null, null);
        }
        
        Photo thumbnailPhoto = photoRepository.findById(thumbnailId)
            .orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));
        
        // 썸네일로 지정할 사진이 해당 앨범에 포함되어 있는지 검증
        boolean isPhotoInAlbum = tierAlbum.getAllPhotos().stream()
            .anyMatch(albumPhoto -> albumPhoto.getPhoto().getId().equals(thumbnailId));
        
        if (!isPhotoInAlbum) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }
        
        return new ThumbnailInfo(thumbnailPhoto.getThumbnailUrl(), thumbnailPhoto.getOriginalUrl());
    }
    
    /**
     * 사진 ID 검증 및 티어별 사진 업데이트
     * 
     * @param tierAlbum 앨범 엔티티
     * @param photosMap 명시적으로 할당된 티어별 사진 ID 맵 (UNASSIGNED 제외)
     * @throws BaseException 사진 ID 검증에 실패한 경우
     */
    private void validateAndUpdateTierPhotos(TierAlbum tierAlbum, Map<String, List<Long>> photosMap) {
        Long albumId = tierAlbum.getId();
        
        // 1. 앨범에 포함된 모든 사진 ID 수집
        List<Long> allAlbumPhotoIds = tierAlbum.getAllPhotos().stream()
            .map(albumPhoto -> albumPhoto.getPhoto().getId())
            .toList();
        
        // 2. 요청에서 명시적으로 할당된 모든 사진 ID들 수집
        List<Long> allAssignedPhotoIds = photosMap.values().stream()
            .flatMap(List::stream)
            .toList();
        
        // 3. 요청에 앨범에 없는 사진이 있는지 검증
        List<Long> invalidPhotoIds = allAssignedPhotoIds.stream()
            .filter(photoId -> !allAlbumPhotoIds.contains(photoId))
            .toList();
        
        if (!invalidPhotoIds.isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }
        
        // 4. 앨범의 모든 사진을 조회하여 영속성 컨텍스트에서 관리
        List<TierAlbumPhoto> allTierAlbumPhotos = tierAlbumPhotoRepository.findByAlbumId(albumId);
        
        // 성능 개선을 위해 Map으로 변환 (photoId -> TierAlbumPhoto)
        Map<Long, TierAlbumPhoto> photoIdToAlbumPhotoMap = allTierAlbumPhotos.stream()
            .collect(Collectors.toMap(
                albumPhoto -> albumPhoto.getPhoto().getId(),
                albumPhoto -> albumPhoto
            ));
        
        // 5. 모든 사진의 티어를 null로 초기화 (영속성 컨텍스트 활용)
        allTierAlbumPhotos.forEach(TierAlbumPhoto::resetTier);
        
        // 6. 각 티어별로 sequence 업데이트 및 티어 설정 (영속성 컨텍스트 활용)
        for (Map.Entry<String, List<Long>> entry : photosMap.entrySet()) {
            String tierName = entry.getKey();
            List<Long> photoIds = entry.getValue();
            
            if (photoIds != null && !photoIds.isEmpty()) {
                // 각 티어 내에서 sequence 순서대로 업데이트
                for (int i = 0; i < photoIds.size(); i++) {
                    Long photoId = photoIds.get(i);
                    
                    // Map에서 해당 사진을 찾아서 업데이트 (O(1) 조회)
                    TierAlbumPhoto targetAlbumPhoto = photoIdToAlbumPhotoMap.get(photoId);
                    if (targetAlbumPhoto == null) {
                        throw new BaseException(ErrorCode.NOT_FOUND);
                    }
                    
                    // 티어와 시퀀스를 한 번에 업데이트
                    Tier tier = Tier.valueOf(tierName);
                    targetAlbumPhoto.updateTierAndSequence(tier, i);
                }
            }
        }
        
        // 7. photoCount 업데이트 - 명시적으로 할당된 사진들만 카운트
        int assignedPhotoCount = photosMap.values().stream()
            .mapToInt(List::size) // 각 티어의 사진 개수
            .sum(); // 모든 티어의 사진 개수 합계
        tierAlbum.updatePhotoCount(assignedPhotoCount);
    }
}
