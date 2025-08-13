package com.ssafy.keepick.photo.application;

import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.photo.application.dto.*;
import com.ssafy.keepick.photo.controller.response.GroupPhotoAllTagResponse;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.domain.PhotoMember;
import com.ssafy.keepick.photo.domain.PhotoTag;
import com.ssafy.keepick.photo.persistence.PhotoMemberRepository;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import com.ssafy.keepick.photo.persistence.PhotoTagRepository;
import com.ssafy.keepick.support.BaseTest;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupPhotoServiceTest extends BaseTest {

    @InjectMocks
    GroupPhotoService groupPhotoService;

    @Mock
    PhotoRepository photoRepository;

    @Mock
    PhotoTagRepository photoTagRepository;

    @Mock
    PhotoMemberRepository photoMemberRepository;

    Long groupId = 1L;
    Group testGroup;
    Photo testPhoto1;
    Photo testPhoto2;
    Photo testPhoto3;

    @BeforeEach
    void setup() {
        testGroup = Group.createGroup("TEST", null);
        testPhoto1 = Photo.builder().group(testGroup).originalUrl("photo1").build();
        testPhoto2 = Photo.builder().group(testGroup).originalUrl("photo2").build();
        testPhoto3 = Photo.builder().group(testGroup).originalUrl("photo3").build();
    }

    @DisplayName("그룹 갤러리에서 흐린 사진만 조회합니다.")
    @Test
    void getBlurryPhotos() {
        // given
        Page<Photo> page = new PageImpl<>(List.of(testPhoto1, testPhoto2, testPhoto3), PageRequest.of(0, 10), 3);

        given(photoRepository.findBlurredPhotosByGroupId(eq(groupId), any(PageRequest.class))).willReturn(page);

        // when
        Page<GroupPhotoDto> dto = groupPhotoService.getBlurredPhotos(groupId, 0, 10);

        // then
        assertThat(dto.getContent()).hasSize(3);
    }

    @DisplayName("그룹 갤러리에서 유사한 사진 그룹을 조회합니다.")
    @Test
    void getSimilarClusters() {
        // given
        testPhoto1.updateClusterId(101L);
        testPhoto2.updateClusterId(101L);
        testPhoto3.updateClusterId(102L);

        PhotoClusterDto dto1 = new PhotoClusterDto(101L, 1L, testPhoto1.getThumbnailUrl(), 2L);
        PhotoClusterDto dto2 = new PhotoClusterDto(102L, 3L, testPhoto1.getThumbnailUrl(), 1L);

        Page<PhotoClusterDto> page = new PageImpl<>(List.of(dto1, dto2), PageRequest.of(0, 10), 2);

        given(photoRepository.findSimilarClusters(eq(groupId), any(PageRequest.class))).willReturn(page);
        given(photoRepository.findAllByGroupIdAndClusterIdInAndDeletedAtIsNull(eq(groupId), anyList())).willReturn(List.of(testPhoto1, testPhoto2, testPhoto3));

        // when
        Page<PhotoClusterDto> resultDto = groupPhotoService.getSimilarClusters(groupId, 0, 10);

        // then
        assertThat(resultDto.getContent()).hasSize(2);

        PhotoClusterDto resultDto1 = resultDto.getContent().get(0);
        assertThat(resultDto1.getClusterId()).isEqualTo(101L);
        assertThat(resultDto1.getPhotos()).hasSize(2);

        PhotoClusterDto resultDto2 = resultDto.getContent().get(1);
        assertThat(resultDto2.getClusterId()).isEqualTo(102L);
        assertThat(resultDto2.getPhotos()).hasSize(1);

    }

    @DisplayName("그룹 갤러리에서 전체 사진, 흐린 사진, 유사한 사진 그룹을 조회합니다.")
    @Test
    void getGroupPhotoOverview() {
        // given
        Page<Photo> allPhotoPage = new PageImpl<>(List.of(testPhoto1, testPhoto2, testPhoto3), PageRequest.of(0, 10), 3);
        given(photoRepository.findByGroupIdAndDeletedAtIsNull(eq(groupId), any(PageRequest.class))).willReturn(allPhotoPage);

        Page<Photo> blurryPhotoPage = new PageImpl<>(List.of(testPhoto1, testPhoto2), PageRequest.of(0, 10), 2);
        given(photoRepository.findBlurredPhotosByGroupId(eq(groupId), any(PageRequest.class))).willReturn(blurryPhotoPage);

        // 유사한 사진 그룹 응답
        testPhoto1.updateClusterId(101L);
        testPhoto2.updateClusterId(101L);
        testPhoto3.updateClusterId(102L);

        PhotoClusterDto dto1 = new PhotoClusterDto(101L, 1L, testPhoto1.getThumbnailUrl(), 2L);
        PhotoClusterDto dto2 = new PhotoClusterDto(102L, 3L, testPhoto1.getThumbnailUrl(), 1L);

        Page<PhotoClusterDto> clusterPhotoPage = new PageImpl<>(List.of(dto1, dto2), PageRequest.of(0, 10), 2);
        given(photoRepository.findSimilarClusters(eq(groupId), any(PageRequest.class))).willReturn(clusterPhotoPage);
        given(photoRepository.findAllByGroupIdAndClusterIdInAndDeletedAtIsNull(eq(groupId), anyList())).willReturn(List.of(testPhoto1, testPhoto2, testPhoto3));

        // when
        GroupPhotoOverviewDto resultDto = groupPhotoService.getGroupPhotoOverview(groupId, 10);

        // then
        assertThat(resultDto.getAllPhotos().getContent()).hasSize(3);
        assertThat(resultDto.getBlurredPhotos().getContent()).hasSize(2);
        assertThat(resultDto.getSimilarPhotos().getContent()).hasSize(2);
    }

    @DisplayName("사진에 태그된 태그명, 회원 이름을 조회합니다.")
    @Test
    void getGroupPhotoTags() {
        // given
        Long photoId = 101L;
        Member testMember1 = createMember(1);
        Member testMember2 = createMember(2);

        PhotoTag tag1 = PhotoTag.of(testPhoto1, "TAG1");
        PhotoTag tag2 = PhotoTag.of(testPhoto1, "TAG2");

        PhotoMember photoMember1 = PhotoMember.of(testPhoto1, testMember1);
        PhotoMember photoMember2 = PhotoMember.of(testPhoto1, testMember2);

        given(photoRepository.existsByGroupIdAndIdAndDeletedAtIsNull(eq(groupId), eq(photoId))).willReturn(true);
        given(photoTagRepository.findAllByPhotoId(photoId)).willReturn(List.of(tag1, tag2));
        given(photoMemberRepository.findAllByPhotoId(photoId)).willReturn(List.of(photoMember1, photoMember2));

        // when
        PhotoTagDto groupPhotoTags = groupPhotoService.getGroupPhotoTags(groupId, photoId);

        // then
        assertThat(groupPhotoTags.getTags()).hasSize(2);
        assertThat(groupPhotoTags.getMemberNicknames()).hasSize(2);
    }

    @Test
    void testGetGroupPhotoAllTags() {
        // given
        Long groupId = 1L;
        List<String> mockTags = List.of("tag1", "tag2", "tag3");
        when(photoTagRepository.findTagsByGroupId(groupId)).thenReturn(mockTags);

        // when
        GroupPhotoTagDto dto = groupPhotoService.getGroupPhotoAllTags(groupId);
        GroupPhotoAllTagResponse response = GroupPhotoAllTagResponse.from(dto);

        // then
        assertNotNull(dto);
        assertNotNull(response);
        // DTO 검증
        assertEquals(3, dto.getTags().size());
        // Response 검증
        assertEquals(dto.getTags(), response.getTags());
    }


    Member createMember(int i) {
        return Member.builder().name("test" + i).email("email" + i).nickname("nick" + i).provider("google" + i).providerId("pid" + i).identificationUrl("url" + i).build();
    }


}