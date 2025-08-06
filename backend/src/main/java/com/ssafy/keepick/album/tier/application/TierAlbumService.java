package com.ssafy.keepick.album.tier.application;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;
import com.ssafy.keepick.album.tier.persistence.TierAlbumPhotoRepository;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TierAlbumService {
    private final TierAlbumRepository tierAlbumRepository;
    private final TierAlbumPhotoRepository tierAlbumPhotoRepository;

    // 티어 앨범 생성
    @Transactional
    public TierAlbumDto createTierAlbum(Long groupId, List<Long> photoIds) {
        // 빈 티어 앨범 생성
        TierAlbum tierAlbum = TierAlbum.createTierAlbum(null, null, null, null, groupId);
        TierAlbum savedTierAlbum = tierAlbumRepository.save(tierAlbum);
        
        // 각 사진에 대해 TierAlbumPhoto 관계 생성
        for (int i = 0; i < photoIds.size(); i++) {
            TierAlbumPhoto tierAlbumPhoto = TierAlbumPhoto.createTierAlbumPhoto(
                savedTierAlbum.getId(), 
                photoIds.get(i), 
                null, // tier는 null (아직 등급이 정해지지 않음)
                i // sequence는 0부터 시작
            );
            tierAlbumPhotoRepository.save(tierAlbumPhoto);
        }
        
        return TierAlbumDto.from(savedTierAlbum);
    }

    // 티어 앨범 목록 조회
    @Transactional(readOnly = true)
    public List<TierAlbumDto> getTierAlbumList(Long groupId) {
        List<TierAlbum> tierAlbums = tierAlbumRepository.findByGroupId(groupId);
        List<TierAlbumDto> tierAlbumDtos = tierAlbums.stream().map(TierAlbumDto::from).toList();
        return tierAlbumDtos;
    }

    // 티어 앨범 상세 조회
    @Transactional(readOnly = true)
    public TierAlbumDto getTierAlbum(Long tierAlbumId) {
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        return TierAlbumDto.from(tierAlbum);
    }

    // 티어 앨범 수정
    @Transactional
    public TierAlbumDto updateTierAlbum(Long tierAlbumId, UpdateTierAlbumRequest request) {
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        
        tierAlbum.update(request.getName(), request.getDescription(), request.getThumbnailUrl(), request.getOriginalUrl());
        return TierAlbumDto.from(tierAlbum);
    }

    // 티어 앨범 삭제
    @Transactional
    public void deleteTierAlbum(Long tierAlbumId) {
        TierAlbum tierAlbum = tierAlbumRepository.findAlbumById(tierAlbumId)
                .orElseThrow(() -> new BaseException(ErrorCode.ALBUM_NOT_FOUND));
        
        tierAlbum.delete();
    }
}
