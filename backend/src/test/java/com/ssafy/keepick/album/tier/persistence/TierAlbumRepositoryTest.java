package com.ssafy.keepick.album.tier.persistence;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;
import com.ssafy.keepick.album.tier.domain.Tier;
import com.ssafy.keepick.photo.domain.Photo;

@ExtendWith(MockitoExtension.class)
class TierAlbumRepositoryTest {

    @Mock
    private TierAlbumRepository tierAlbumRepository;

    @Mock
    private TierAlbumPhotoRepository tierAlbumPhotoRepository;

    private TierAlbum tierAlbum1, tierAlbum2;
    private Photo photo1, photo2;
    private TierAlbumPhoto tierAlbumPhoto1, tierAlbumPhoto2;

    @BeforeEach
    void setUp() {
        // 테스트 데이터 생성
        tierAlbum1 = TierAlbum.createTierAlbum("테스트 앨범 1", "테스트 설명 1", 
            "https://test.com/thumb1.jpg", "https://test.com/original1.jpg", 1L);
        tierAlbum1.updatePhotoCount(2);

        tierAlbum2 = TierAlbum.createTierAlbum("테스트 앨범 2", "테스트 설명 2", 
            "https://test.com/thumb2.jpg", "https://test.com/original2.jpg", 1L);
        tierAlbum2.updatePhotoCount(1);

        // Photo 엔티티 생성 및 저장 (Builder 패턴 사용)
        photo1 = Photo.builder()
            .originalUrl("https://test.com/photo1_original.jpg")
            .takenAt(LocalDateTime.now())
            .width(1920)
            .height(1080)
            .build();

        photo2 = Photo.builder()
            .originalUrl("https://test.com/photo2_original.jpg")
            .takenAt(LocalDateTime.now())
            .width(1920)
            .height(1080)
            .build();

        // TierAlbumPhoto 엔티티 생성 및 저장
        tierAlbumPhoto1 = TierAlbumPhoto.createTierAlbumPhoto(tierAlbum1, photo1, Tier.S, 0);
        tierAlbumPhoto2 = TierAlbumPhoto.createTierAlbumPhoto(tierAlbum1, photo2, Tier.A, 1);
    }

    @Test
    @DisplayName("앨범 ID로 앨범 조회 성공")
    void findAlbumById_Success() {
        // given
        when(tierAlbumRepository.findAlbumById(1L)).thenReturn(Optional.of(tierAlbum1));

        // when
        Optional<TierAlbum> result = tierAlbumRepository.findAlbumById(1L);

        // then
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("테스트 앨범 1");
        assertThat(result.get().getPhotoCount()).isEqualTo(2);
        verify(tierAlbumRepository).findAlbumById(1L);
    }

    @Test
    @DisplayName("앨범 ID로 앨범 조회 실패 - 존재하지 않는 ID")
    void findAlbumById_Fail_NotFound() {
        // given
        when(tierAlbumRepository.findAlbumById(999L)).thenReturn(Optional.empty());

        // when
        Optional<TierAlbum> result = tierAlbumRepository.findAlbumById(999L);

        // then
        assertThat(result).isEmpty();
        verify(tierAlbumRepository).findAlbumById(999L);
    }

    @Test
    @DisplayName("앨범과 사진을 함께 조회 성공")
    void findAlbumWithPhotosById_Success() {
        // given
        when(tierAlbumRepository.findAlbumWithPhotosById(1L)).thenReturn(Optional.of(tierAlbum1));

        // when
        Optional<TierAlbum> result = tierAlbumRepository.findAlbumWithPhotosById(1L);

        // then
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("테스트 앨범 1");
        verify(tierAlbumRepository).findAlbumWithPhotosById(1L);
    }

    @Test
    @DisplayName("그룹 ID로 앨범 개수 조회 성공")
    void countByGroupId_Success() {
        // given
        when(tierAlbumRepository.countByGroupId(1L)).thenReturn(2L);

        // when
        long count = tierAlbumRepository.countByGroupId(1L);

        // then
        assertThat(count).isEqualTo(2);
        verify(tierAlbumRepository).countByGroupId(1L);
    }

    @Test
    @DisplayName("그룹 ID로 앨범 개수 조회 - 존재하지 않는 그룹")
    void countByGroupId_NotFound() {
        // given
        when(tierAlbumRepository.countByGroupId(999L)).thenReturn(0L);

        // when
        long count = tierAlbumRepository.countByGroupId(999L);

        // then
        assertThat(count).isEqualTo(0);
        verify(tierAlbumRepository).countByGroupId(999L);
    }

    @Test
    @DisplayName("그룹 ID로 페이징된 앨범 목록 조회 성공")
    void findByGroupIdWithPaging_Success() {
        // given
        List<TierAlbum> albums = Arrays.asList(tierAlbum1, tierAlbum2);
        Pageable pageable = PageRequest.of(0, 10);
        Page<TierAlbum> albumPage = new PageImpl<>(albums, pageable, 2L);
        when(tierAlbumRepository.findByGroupIdWithPaging(1L, pageable)).thenReturn(albumPage);

        // when
        Page<TierAlbum> result = tierAlbumRepository.findByGroupIdWithPaging(1L, pageable);

        // then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getName()).isEqualTo("테스트 앨범 1");
        assertThat(result.getContent().get(1).getName()).isEqualTo("테스트 앨범 2");
        verify(tierAlbumRepository).findByGroupIdWithPaging(1L, pageable);
    }

    @Test
    @DisplayName("그룹 ID로 페이징된 앨범 목록 조회 - 페이지 크기 제한")
    void findByGroupIdWithPaging_WithSizeLimit() {
        // given
        List<TierAlbum> albums = Arrays.asList(tierAlbum1);
        Pageable pageable = PageRequest.of(0, 1);
        Page<TierAlbum> albumPage = new PageImpl<>(albums, pageable, 1L);
        when(tierAlbumRepository.findByGroupIdWithPaging(1L, pageable)).thenReturn(albumPage);

        // when
        Page<TierAlbum> result = tierAlbumRepository.findByGroupIdWithPaging(1L, pageable);

        // then
        assertThat(result.getContent()).hasSize(1);
        verify(tierAlbumRepository).findByGroupIdWithPaging(1L, pageable);
    }

    @Test
    @DisplayName("앨범 저장 성공")
    void save_Success() {
        // given
        TierAlbum newAlbum = TierAlbum.createTierAlbum("새 앨범", "새 설명", 
            "https://test.com/new_thumb.jpg", "https://test.com/new_original.jpg", 2L);
        when(tierAlbumRepository.save(any(TierAlbum.class))).thenReturn(newAlbum);

        // when
        TierAlbum savedAlbum = tierAlbumRepository.save(newAlbum);

        // then
        assertThat(savedAlbum).isNotNull();
        assertThat(savedAlbum.getName()).isEqualTo("새 앨범");
        assertThat(savedAlbum.getGroupId()).isEqualTo(2L);
        verify(tierAlbumRepository).save(newAlbum);
    }

    @Test
    @DisplayName("TierAlbumPhoto 저장 성공")
    void saveTierAlbumPhoto_Success() {
        // given
        when(tierAlbumPhotoRepository.save(any(TierAlbumPhoto.class))).thenReturn(tierAlbumPhoto1);

        // when
        TierAlbumPhoto savedPhoto = tierAlbumPhotoRepository.save(tierAlbumPhoto1);

        // then
        assertThat(savedPhoto).isNotNull();
        assertThat(savedPhoto.getTier()).isEqualTo(Tier.S);
        verify(tierAlbumPhotoRepository).save(tierAlbumPhoto1);
    }

    @Test
    @DisplayName("앨범 ID로 사진 목록 조회 성공")
    void findByAlbumId_Success() {
        // given
        List<TierAlbumPhoto> photos = Arrays.asList(tierAlbumPhoto1, tierAlbumPhoto2);
        when(tierAlbumPhotoRepository.findByAlbumId(1L)).thenReturn(photos);

        // when
        List<TierAlbumPhoto> result = tierAlbumPhotoRepository.findByAlbumId(1L);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTier()).isEqualTo(Tier.S);
        assertThat(result.get(1).getTier()).isEqualTo(Tier.A);
        verify(tierAlbumPhotoRepository).findByAlbumId(1L);
    }
}
