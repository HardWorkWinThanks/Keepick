package com.ssafy.keepick.photo.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import com.ssafy.keepick.photo.controller.request.GroupPhotoDeleteRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoSearchRequest;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.support.BaseTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;


@ExtendWith(MockitoExtension.class)
@DisplayName("GroupPhotoService 테스트")
public class PhotoServiceTest extends BaseTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private PhotoRepository photoRepository;

    @InjectMocks
    private GroupPhotoService groupPhotoService;

    private Group testGroup;
    private Photo testPhoto;
    private GroupPhotoDeleteRequest deleteRequest;
    private GroupPhotoSearchRequest searchRequest;

    @BeforeEach
    void setUp() {
        testGroup = Group.createGroup("테스트 그룹", null);

        testPhoto = Photo.builder()
                .group(testGroup)
                .originalUrl("https://example.com/photo1.jpg")
                .build();

        deleteRequest = GroupPhotoDeleteRequest.builder()
                .photoIds(Arrays.asList(1L, 2L))
                .build();

        searchRequest = GroupPhotoSearchRequest.builder()
                .page(0)
                .size(10)
                .memberIds(Arrays.asList(1L, 2L))
                .tags(Arrays.asList("FOOD"))
                .startDate(LocalDate.now().minusDays(7))
                .endDate(LocalDate.now())
                .build();
    }


    @Nested
    @DisplayName("그룹 사진 삭제 테스트")
    class DeleteGroupPhotoTest {

        @Test
        @DisplayName("사진 삭제 성공 테스트")
        void deleteGroupPhoto_Success() {
            // given
            List<Long> notInAlbumPhotoIds = List.of(1L);
            given(groupRepository.findById(1L)).willReturn(Optional.of(testGroup));
            given(photoRepository.findPhotoIdNotInAnyAlbum(deleteRequest.getPhotoIds())).willReturn(notInAlbumPhotoIds);
            given(photoRepository.clearSinglePhotoClusters(1L)).willReturn(0L);
            doNothing().when(photoRepository).softDeleteAllById(anyList());

            // when
            List<GroupPhotoDto> result = groupPhotoService.deleteGroupPhoto(1L, deleteRequest);

            // then
            assertThat(result).hasSize(1);
            verify(groupRepository).findById(1L);
            verify(photoRepository).softDeleteAllById(notInAlbumPhotoIds);
        }

        @Test
        @DisplayName("존재하지 않는 그룹의 사진을 삭제할때 실패 테스트")
        void deleteGroupPhoto_Fail_GroupNotFound() {
            // given
            given(groupRepository.findById(999L)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> groupPhotoService.deleteGroupPhoto(999L, deleteRequest))
                    .isInstanceOf(BaseException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.GROUP_NOT_FOUND);

            verify(groupRepository).findById(999L);
            verify(photoRepository, never()).softDeleteAllById(any());
        }

        @Test
        @DisplayName("삭제 요청 목록이 비어있는 경우 테스트")
        void deleteGroupPhoto_Success_EmptyDeleteList() {
            // given
            GroupPhotoDeleteRequest emptyRequest = GroupPhotoDeleteRequest.builder()
                    .photoIds(Collections.emptyList())
                    .build();
            given(groupRepository.findById(1L)).willReturn(Optional.of(testGroup));

            // when
            List<GroupPhotoDto> result = groupPhotoService.deleteGroupPhoto(1L, emptyRequest);

            // then
            assertThat(result).isEmpty();
            verify(groupRepository).findById(1L);
            verify(photoRepository).softDeleteAllById(Collections.emptyList());
        }

        @Test
        @DisplayName("사진 삭제 후 클러스터 업데이트 호출 테스트")
        void deleteGroupPhoto_deleteCluster() {
            // given
            List<Long> notInAlbumPhotoIds = List.of(1L);
            given(groupRepository.findById(1L)).willReturn(Optional.of(testGroup));
            given(photoRepository.findPhotoIdNotInAnyAlbum(deleteRequest.getPhotoIds())).willReturn(notInAlbumPhotoIds);
            given(photoRepository.clearSinglePhotoClusters(1L)).willReturn(0L);
            doNothing().when(photoRepository).softDeleteAllById(anyList());

            // when
            groupPhotoService.deleteGroupPhoto(1L, deleteRequest);

            // then
            verify(photoRepository).clearSinglePhotoClusters(1L);
        }
    }

    @Nested
    @DisplayName("그룹 사진 조회 테스트")
    class GetGroupPhotosTest {

        @Test
        @DisplayName("페이징 + 필터링된 사진 목록 조회 테스트")
        void getGroupPhotos_Success() {
            // given
            List<Photo> photos = Arrays.asList(testPhoto);
            Page<Photo> photoPage = new PageImpl<>(photos, PageRequest.of(0, 10), 1);

            given(photoRepository.findAllPhotosByGroupIdAndOption(
                    any(PageRequest.class), eq(1L), any(), any(), any(), any()))
                    .willReturn(photoPage);

            // when
            Page<GroupPhotoDto> result = groupPhotoService.getGroupPhotos(1L, searchRequest);

            // then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getNumber()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(10);

            verify(photoRepository).findAllPhotosByGroupIdAndOption(
                    PageRequest.of(0, 10),
                    1L,
                    searchRequest.getMemberIds(),
                    searchRequest.getTags(),
                    searchRequest.getStartDate(),
                    searchRequest.getEndDate()
            );
        }

        @Test
        @DisplayName("쿼리의 반환 값이 없는 경우 테스트")
        void getGroupPhotos_Success_EmptyResult() {
            // given
            Page<Photo> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
            given(photoRepository.findAllPhotosByGroupIdAndOption(
                    any(PageRequest.class), eq(1L), any(), any(), any(), any()))
                    .willReturn(emptyPage);

            // when
            Page<GroupPhotoDto> result = groupPhotoService.getGroupPhotos(1L, searchRequest);

            // then
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }

        @Test
        @DisplayName("필터링 조건 없이 조회한 경우 테스트")
        void getGroupPhotos_Success_NoSearchConditions() {
            // given
            GroupPhotoSearchRequest simpleRequest = GroupPhotoSearchRequest.builder()
                    .page(0)
                    .size(10)
                    .build();

            List<Photo> photos = Arrays.asList(testPhoto);
            Page<Photo> photoPage = new PageImpl<>(photos, PageRequest.of(0, 10), 1);

            given(photoRepository.findAllPhotosByGroupIdAndOption(
                    any(PageRequest.class), eq(1L), any(), any(), any(), any()))
                    .willReturn(photoPage);

            // when
            Page<GroupPhotoDto> result = groupPhotoService.getGroupPhotos(1L, simpleRequest);

            // then
            assertThat(result.getContent()).hasSize(1);
            verify(photoRepository).findAllPhotosByGroupIdAndOption(
                    PageRequest.of(0, 10),
                    1L,
                    null,
                    null,
                    null,
                    null
            );
        }
    }

    @Nested
    @DisplayName("랜덤 사진 조회 테스트")
    class GetRandomPhotosTest {

        @Test
        @DisplayName("랜덤 사진 조회 성공")
        void getRandomPhotos_Success() {
            // given
            Long memberId = 1L;
            int size = 5;
            int offset = 0;
            List<Photo> randomPhotos = Arrays.asList(testPhoto);

            given(photoRepository.findRandomByMemberId(memberId, size, offset))
                    .willReturn(randomPhotos);

            // when
            List<GroupPhotoDto> result = groupPhotoService.getRandomPhotos(memberId, size);

            // then
            assertThat(result).hasSize(1);
            verify(photoRepository).findRandomByMemberId(memberId, size, offset);
        }

        @Test
        @DisplayName("랜덤 사진 조회 사진이 없는 경우 테스트")
        void getRandomPhotos_Success_EmptyResult() {
            // given
            Long memberId = 1L;
            int size = 5;
            int offset = 0;

            given(photoRepository.findRandomByMemberId(memberId, size, offset))
                    .willReturn(Collections.emptyList());

            // when
            List<GroupPhotoDto> result = groupPhotoService.getRandomPhotos(memberId, size);

            // then
            assertThat(result).isEmpty();
            verify(photoRepository).findRandomByMemberId(memberId, size, offset);
        }
    }
}