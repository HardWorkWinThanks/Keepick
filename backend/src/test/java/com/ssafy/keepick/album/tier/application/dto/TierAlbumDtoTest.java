package com.ssafy.keepick.album.tier.application.dto;

import static org.assertj.core.api.Assertions.*;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.ssafy.keepick.album.tier.domain.TierAlbum;

class TierAlbumDtoTest {

    @Test
    @DisplayName("TierAlbum 엔티티로부터 DTO 생성 성공")
    void from_Success() {
        // given
        TierAlbum tierAlbum = TierAlbum.createTierAlbum("테스트 앨범", "테스트 설명", 
            "https://test.com/thumb.jpg", "https://test.com/original.jpg", 1L);
        tierAlbum.updatePhotoCount(5);

        // when
        TierAlbumDto dto = TierAlbumDto.from(tierAlbum);

        // then
        assertThat(dto).isNotNull();
        assertThat(dto.getName()).isEqualTo("테스트 앨범");
        assertThat(dto.getDescription()).isEqualTo("테스트 설명");
        assertThat(dto.getThumbnailUrl()).isEqualTo("https://test.com/thumb.jpg");
        assertThat(dto.getOriginalUrl()).isEqualTo("https://test.com/original.jpg");
        assertThat(dto.getPhotoCount()).isEqualTo(5);
        // BaseTimeEntity의 필드들은 테스트에서 제외 (실제 환경에서는 JPA가 자동으로 설정)
    }

    @Test
    @DisplayName("Builder 패턴으로 DTO 생성 성공")
    void builder_Success() {
        // given
        LocalDateTime now = LocalDateTime.now();

        // when
        TierAlbumDto dto = TierAlbumDto.builder()
            .id(1L)
            .name("빌더 테스트 앨범")
            .description("빌더 테스트 설명")
            .thumbnailUrl("https://test.com/builder_thumb.jpg")
            .originalUrl("https://test.com/builder_original.jpg")
            .photoCount(10)
            .createdAt(now)
            .updatedAt(now)
            .build();

        // then
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getName()).isEqualTo("빌더 테스트 앨범");
        assertThat(dto.getDescription()).isEqualTo("빌더 테스트 설명");
        assertThat(dto.getThumbnailUrl()).isEqualTo("https://test.com/builder_thumb.jpg");
        assertThat(dto.getOriginalUrl()).isEqualTo("https://test.com/builder_original.jpg");
        assertThat(dto.getPhotoCount()).isEqualTo(10);
        assertThat(dto.getCreatedAt()).isEqualTo(now);
        assertThat(dto.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("null 값이 포함된 엔티티로부터 DTO 생성")
    void from_WithNullValues() {
        // given
        TierAlbum tierAlbum = TierAlbum.createTierAlbum("테스트 앨범", null, 
            null, null, 1L);
        
        // Reflection을 사용하여 id 설정
        try {
            java.lang.reflect.Field idField = TierAlbum.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(tierAlbum, 1L);
        } catch (Exception e) {
            // 테스트 환경에서는 무시
        }

        // when
        TierAlbumDto dto = TierAlbumDto.from(tierAlbum);

        // then
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getName()).isEqualTo("테스트 앨범");
        assertThat(dto.getDescription()).isNull();
        assertThat(dto.getThumbnailUrl()).isNull();
        assertThat(dto.getOriginalUrl()).isNull();
    }
}
