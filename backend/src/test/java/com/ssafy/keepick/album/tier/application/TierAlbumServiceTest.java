package com.ssafy.keepick.album.tier.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mockStatic;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ssafy.keepick.album.tier.application.dto.TierAlbumDetailDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumListDto;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;
import com.ssafy.keepick.album.tier.domain.Tier;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;
import com.ssafy.keepick.album.tier.persistence.TierAlbumPhotoRepository;
import com.ssafy.keepick.album.tier.persistence.TierAlbumRepository;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.image.domain.Photo;
import com.ssafy.keepick.image.persistence.PhotoRepository;

@ExtendWith(MockitoExtension.class)
class TierAlbumServiceTest {

    @Mock
    private TierAlbumRepository tierAlbumRepository;

    @Mock
    private TierAlbumPhotoRepository tierAlbumPhotoRepository;

    @Mock
    private PhotoRepository photoRepository;
    
    @Mock
    private GroupRepository groupRepository;
    
    @Mock
    private GroupMemberRepository groupMemberRepository;

    @InjectMocks
    private TierAlbumService tierAlbumService;

    private TierAlbum tierAlbum;
    private Photo photo1, photo2;
    private TierAlbumPhoto tierAlbumPhoto1, tierAlbumPhoto2;
    private UpdateTierAlbumRequest updateRequest;

    @BeforeEach
    void setUp() {
        // 테스트 데이터 설정
        tierAlbum = TierAlbum.createTierAlbum("테스트 앨범", "테스트 설명", 
            "https://test.com/thumb.jpg", "https://test.com/original.jpg", 1L);
        tierAlbum.updatePhotoCount(2);
        
        // Reflection을 사용하여 BaseTimeEntity 필드 설정
        try {
            java.lang.reflect.Field createdAtField = BaseTimeEntity.class.getDeclaredField("createdAt");
            createdAtField.setAccessible(true);
            createdAtField.set(tierAlbum, LocalDateTime.of(2024, 1, 15, 10, 30));
            
            java.lang.reflect.Field updatedAtField = BaseTimeEntity.class.getDeclaredField("updatedAt");
            updatedAtField.setAccessible(true);
            updatedAtField.set(tierAlbum, LocalDateTime.of(2024, 1, 15, 14, 45));
        } catch (Exception e) {
            // 테스트 환경에서는 무시
        }

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

        tierAlbumPhoto1 = TierAlbumPhoto.createTierAlbumPhoto(tierAlbum, photo1, Tier.S, 0);
        tierAlbumPhoto2 = TierAlbumPhoto.createTierAlbumPhoto(tierAlbum, photo2, Tier.A, 1);

        Map<String, List<Long>> photos = new HashMap<>();
        photos.put("S", Arrays.asList(1L));
        photos.put("A", Arrays.asList(2L));
        
        updateRequest = UpdateTierAlbumRequest.builder()
            .name("수정된 앨범")
            .description("수정된 설명")
            .thumbnailId(1L)
            .photos(photos)
            .build();
    }

    @Test
    @DisplayName("티어 앨범 생성 성공")
    void createTierAlbum_Success() {
        // given
        Long groupId = 1L;
        Long currentUserId = 1L;
        List<Long> photoIds = Arrays.asList(1L, 2L);

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId)).thenReturn(Optional.of(Group.createGroup("테스트 그룹", null)));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);
            when(tierAlbumRepository.save(any(TierAlbum.class))).thenReturn(tierAlbum);
            when(photoRepository.findById(1L)).thenReturn(Optional.of(photo1));
            when(photoRepository.findById(2L)).thenReturn(Optional.of(photo2));
            when(tierAlbumPhotoRepository.save(any(TierAlbumPhoto.class))).thenReturn(tierAlbumPhoto1);

            // when
            TierAlbumDto result = tierAlbumService.createTierAlbum(groupId, photoIds);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(tierAlbum.getId());
            verify(tierAlbumRepository).save(any(TierAlbum.class));
            verify(photoRepository, times(2)).findById(anyLong());
            verify(tierAlbumPhotoRepository, times(2)).save(any(TierAlbumPhoto.class));
        }
    }

    @Test
    @DisplayName("티어 앨범 생성 실패 - 존재하지 않는 사진")
    void createTierAlbum_Fail_PhotoNotFound() {
        // given
        Long groupId = 1L;
        Long currentUserId = 1L;
        List<Long> photoIds = Arrays.asList(1L, 2L);

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId)).thenReturn(Optional.of(Group.createGroup("테스트 그룹", null)));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);
            when(tierAlbumRepository.save(any(TierAlbum.class))).thenReturn(tierAlbum);
            when(photoRepository.findById(1L)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> tierAlbumService.createTierAlbum(groupId, photoIds))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND);
        }
    }

    @Test
    @DisplayName("티어 앨범 목록 조회 성공")
    void getTierAlbumListWithPaging_Success() {
        // given
        Long groupId = 1L;
        Long currentUserId = 1L;
        int page = 1;
        int size = 10;
        List<TierAlbum> albums = Arrays.asList(tierAlbum);

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId)).thenReturn(Optional.of(Group.createGroup("테스트 그룹", null)));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);
            when(tierAlbumRepository.countByGroupId(groupId)).thenReturn(1L);
            when(tierAlbumRepository.findByGroupIdWithPaging(groupId, 0, size)).thenReturn(albums);

            // when
            TierAlbumListDto result = tierAlbumService.getTierAlbumListWithPaging(groupId, page, size);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getAlbums()).hasSize(1);
            assertThat(result.getAlbums().get(0).getName()).isEqualTo("테스트 앨범");
            assertThat(result.getAlbums().get(0).getCreatedAt()).isNotNull();
            assertThat(result.getAlbums().get(0).getUpdatedAt()).isNotNull();
            assertThat(result.getPageInfo().getTotalElement()).isEqualTo(1L);
            assertThat(result.getPageInfo().getPage()).isEqualTo(1);
            assertThat(result.getPageInfo().getSize()).isEqualTo(10);
            assertThat(result.getPageInfo().getTotalPage()).isEqualTo(1);
            assertThat(result.getPageInfo().isHasNext()).isFalse();
            verify(tierAlbumRepository).countByGroupId(groupId);
            verify(tierAlbumRepository).findByGroupIdWithPaging(groupId, 0, size);
        }
    }

    @Test
    @DisplayName("티어 앨범 목록 조회 - 빈 결과")
    void getTierAlbumListWithPaging_EmptyResult() {
        // given
        Long groupId = 1L;
        Long currentUserId = 1L;
        int page = 1;
        int size = 10;

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId)).thenReturn(Optional.of(Group.createGroup("테스트 그룹", null)));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);
            when(tierAlbumRepository.countByGroupId(groupId)).thenReturn(0L);
            when(tierAlbumRepository.findByGroupIdWithPaging(groupId, 0, size)).thenReturn(Arrays.asList());

            // when
            TierAlbumListDto result = tierAlbumService.getTierAlbumListWithPaging(groupId, page, size);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getAlbums()).isEmpty();
            assertThat(result.getPageInfo().getTotalElement()).isEqualTo(0L);
            assertThat(result.getPageInfo().getTotalPage()).isEqualTo(0);
            assertThat(result.getPageInfo().isHasNext()).isFalse();
        }
    }

    @Test
    @DisplayName("티어 앨범 목록 조회 - 페이징 계산 검증")
    void getTierAlbumListWithPaging_PagingCalculation() {
        // given
        Long groupId = 1L;
        Long currentUserId = 1L;
        int page = 3;
        int size = 5;
        List<TierAlbum> albums = Arrays.asList(tierAlbum);

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId)).thenReturn(Optional.of(Group.createGroup("테스트 그룹", null)));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);
            when(tierAlbumRepository.countByGroupId(groupId)).thenReturn(15L);
            when(tierAlbumRepository.findByGroupIdWithPaging(groupId, 10, size)).thenReturn(albums);

            // when
            TierAlbumListDto result = tierAlbumService.getTierAlbumListWithPaging(groupId, page, size);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getPageInfo().getPage()).isEqualTo(3);
            assertThat(result.getPageInfo().getSize()).isEqualTo(5);
            assertThat(result.getPageInfo().getTotalElement()).isEqualTo(15L);
            assertThat(result.getPageInfo().getTotalPage()).isEqualTo(3);
            assertThat(result.getPageInfo().isHasNext()).isFalse(); // 마지막 페이지
            verify(tierAlbumRepository).findByGroupIdWithPaging(groupId, 10, size); // offset = (3-1) * 5 = 10
        }
    }

    @Test
    @DisplayName("티어 앨범 상세 조회 성공")
    void getTierAlbumDetail_Success() {
        // given
        Long groupId = 1L;
        Long tierAlbumId = 1L;
        Long currentUserId = 1L;

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId))
                .thenReturn(Optional.of(Group.createGroup("테스트 그룹", null)));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);
            when(tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId))
                .thenReturn(Optional.of(tierAlbum));

            // when
            TierAlbumDetailDto result = tierAlbumService.getTierAlbumDetail(groupId, tierAlbumId);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo(tierAlbum.getName());
            verify(groupRepository).findById(groupId);
            verify(groupMemberRepository).existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED);
            verify(tierAlbumRepository).findAlbumWithPhotosById(tierAlbumId);
        }
    }

    @Test
    @DisplayName("티어 앨범 상세 조회 실패 - 존재하지 않는 앨범")
    void getTierAlbumDetail_Fail_AlbumNotFound() {
        // given
        Long groupId = 1L;
        Long tierAlbumId = 1L;
        Long currentUserId = 1L;

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId))
                .thenReturn(Optional.of(Group.createGroup("테스트 그룹", null)));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);
            when(tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId))
                .thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> tierAlbumService.getTierAlbumDetail(groupId, tierAlbumId))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ALBUM_NOT_FOUND);
        }
    }

    @Test
    @DisplayName("티어 앨범 상세 조회 실패 - 존재하지 않는 그룹")
    void getTierAlbumDetail_Fail_GroupNotFound() {
        // given
        Long groupId = 1L;
        Long tierAlbumId = 1L;
        Long currentUserId = 1L;

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId))
                .thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> tierAlbumService.getTierAlbumDetail(groupId, tierAlbumId))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.GROUP_NOT_FOUND);
        }
    }

    @Test
    @DisplayName("티어 앨범 상세 조회 실패 - 그룹 멤버가 아님")
    void getTierAlbumDetail_Fail_NotGroupMember() {
        // given
        Long groupId = 1L;
        Long tierAlbumId = 1L;
        Long currentUserId = 1L;

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId))
                .thenReturn(Optional.of(Group.createGroup("테스트 그룹", null)));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(false);

            // when & then
            assertThatThrownBy(() -> tierAlbumService.getTierAlbumDetail(groupId, tierAlbumId))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
        }
    }

    @Test
    @DisplayName("티어 앨범 상세 조회 실패 - 앨범이 다른 그룹에 속함")
    void getTierAlbumDetail_Fail_AlbumBelongsToDifferentGroup() {
        // given
        Long groupId = 1L;
        Long differentGroupId = 2L;
        Long tierAlbumId = 1L;
        Long currentUserId = 1L;

        // 다른 그룹에 속한 앨범 생성
        TierAlbum differentGroupAlbum = TierAlbum.createTierAlbum("다른 그룹 앨범", "다른 그룹 설명", 
            "https://test.com/thumb.jpg", "https://test.com/original.jpg", differentGroupId);

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(groupRepository.findById(groupId))
                .thenReturn(Optional.of(Group.createGroup("테스트 그룹", null)));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(groupId, currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);
            when(tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId))
                .thenReturn(Optional.of(differentGroupAlbum));

            // when & then
            assertThatThrownBy(() -> tierAlbumService.getTierAlbumDetail(groupId, tierAlbumId))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
        }
    }

    @Test
    @DisplayName("티어 앨범 수정 성공")
    void updateTierAlbum_Success() {
        // given
        Long tierAlbumId = 1L;
        Long currentUserId = 1L;

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId))
                .thenReturn(Optional.of(tierAlbum))
                .thenReturn(Optional.of(tierAlbum)); // 두 번째 호출을 위한 모킹
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(tierAlbum.getGroupId(), currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);
            when(photoRepository.findById(1L)).thenReturn(Optional.of(photo1));

            // when
            TierAlbumDto result = tierAlbumService.updateTierAlbum(tierAlbumId, updateRequest);

            // then
            assertThat(result).isNotNull();
            verify(tierAlbumRepository, times(2)).findAlbumWithPhotosById(tierAlbumId);
            verify(photoRepository).findById(1L);
            verify(tierAlbumPhotoRepository).excludePhotosNotInList(eq(tierAlbumId), anyList());
            verify(tierAlbumPhotoRepository, times(2)).updateTiersByPhotoIds(eq(tierAlbumId), any(Tier.class), anyList());
        }
    }

    @Test
    @DisplayName("티어 앨범 수정 실패 - 존재하지 않는 앨범")
    void updateTierAlbum_Fail_AlbumNotFound() {
        // given
        Long tierAlbumId = 1L;

        when(tierAlbumRepository.findAlbumWithPhotosById(tierAlbumId))
            .thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> tierAlbumService.updateTierAlbum(tierAlbumId, updateRequest))
            .isInstanceOf(BaseException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ALBUM_NOT_FOUND);
    }

    @Test
    @DisplayName("티어 앨범 삭제 성공")
    void deleteTierAlbum_Success() {
        // given
        Long tierAlbumId = 1L;
        Long currentUserId = 1L;

        try (var mockedAuth = mockStatic(AuthenticationUtil.class)) {
            mockedAuth.when(AuthenticationUtil::getCurrentUserId).thenReturn(currentUserId);
            
            when(tierAlbumRepository.findAlbumById(tierAlbumId))
                .thenReturn(Optional.of(tierAlbum));
            when(groupMemberRepository.existsByGroupIdAndMemberIdAndStatus(tierAlbum.getGroupId(), currentUserId, GroupMemberStatus.ACCEPTED))
                .thenReturn(true);

            // when
            tierAlbumService.deleteTierAlbum(tierAlbumId);

            // then
            verify(tierAlbumRepository).findAlbumById(tierAlbumId);
            assertThat(tierAlbum.isDeleted()).isTrue();
        }
    }

    @Test
    @DisplayName("티어 앨범 삭제 실패 - 존재하지 않는 앨범")
    void deleteTierAlbum_Fail_AlbumNotFound() {
        // given
        Long tierAlbumId = 1L;

        when(tierAlbumRepository.findAlbumById(tierAlbumId))
            .thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> tierAlbumService.deleteTierAlbum(tierAlbumId))
            .isInstanceOf(BaseException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ALBUM_NOT_FOUND);
    }
}
