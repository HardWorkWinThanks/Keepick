package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.album.tier.domain.Tier;
import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.domain.GroupMember;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.photo.application.dto.PhotoClusterDto;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.domain.PhotoMember;
import com.ssafy.keepick.photo.domain.PhotoTag;
import com.ssafy.keepick.support.BaseRepositoryTest;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

@DisplayName("PhotoRepository 테스트")
class PhotoRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Group testGroup;
    private Member testMember1, testMember2;
    private Photo testPhoto1, testPhoto2, testPhoto3, deletedPhoto;
    private String tag1, tag2;

    @BeforeEach
    void setUp() {
        // 그룹 생성
        testGroup = Group.createGroup("테스트 그룹", null);
        entityManager.persistAndFlush(testGroup);

        // 멤버 생성
        testMember1 = Member.builder()
                .name("멤버1")
                .email("member1@test.com")
                .nickname("닉네임1")
                .profileUrl("https://example.com/profile1.jpg")
                .provider("kakao")
                .providerId("kakao_123456")
                .identificationUrl("https://example.com/id1")
                .build();
        testMember2 = Member.builder()
                .name("멤버2")
                .email("member2@test.com")
                .nickname("닉네임2")
                .profileUrl("https://example.com/profile2.jpg")
                .provider("google")
                .providerId("google_789012")
                .identificationUrl("https://example.com/id2")
                .build();
        entityManager.persist(testMember1);
        entityManager.persist(testMember2);

        // 그룹 멤버 생성
        GroupMember groupMember1 = GroupMember.createGroupMember(testGroup, testMember1);
        GroupMember groupMember2 = GroupMember.createGroupMember(testGroup, testMember2);
        entityManager.persist(groupMember1);
        entityManager.persist(groupMember2);

        // 태그 생성
        tag1 = "FOOD";
        tag2 = "SCENERY";

        // 사진 생성
        testPhoto1 = Photo.builder()
                .group(testGroup)
                .originalUrl("https://example.com/photo1.jpg")
                .takenAt(LocalDateTime.now().minusDays(1))
                .build();

        testPhoto2 = Photo.builder()
                .group(testGroup)
                .originalUrl("https://example.com/photo2.jpg")
                .takenAt(LocalDateTime.now().minusDays(2))
                .build();

        testPhoto3 = Photo.builder()
                .group(testGroup)
                .originalUrl("https://example.com/photo3.jpg")
                .takenAt(LocalDateTime.now().minusDays(3))
                .build();

        deletedPhoto = Photo.builder()
                .group(testGroup)
                .originalUrl("https://example.com/deleted.jpg")
                .takenAt(LocalDateTime.now().minusDays(4))
                .build();
        deletedPhoto.delete();

        entityManager.persist(testPhoto1);
        entityManager.persist(testPhoto2);
        entityManager.persist(testPhoto3);
        entityManager.persist(deletedPhoto);

        // PhotoMember 관계 생성
        PhotoMember photoMember1 = PhotoMember.of(testPhoto1, testMember1);
        PhotoMember photoMember2 = PhotoMember.of(testPhoto2, testMember2);
        PhotoMember photoMember3 = PhotoMember.of(testPhoto3, testMember1);

        entityManager.persist(photoMember1);
        entityManager.persist(photoMember2);
        entityManager.persist(photoMember3);

        // PhotoTag 관계 생성
        PhotoTag photoTag1 = PhotoTag.of(testPhoto1, tag1);
        PhotoTag photoTag2 = PhotoTag.of(testPhoto2, tag2);
        PhotoTag photoTag3 = PhotoTag.of(testPhoto3, tag1);

        entityManager.persist(photoTag1);
        entityManager.persist(photoTag2);
        entityManager.persist(photoTag3);

        entityManager.flush();
        entityManager.clear();
    }

    @Nested
    @DisplayName("softDeleteAllById 테스트")
    class SoftDeleteAllByIdTest {

        @Test
        @DisplayName("여러장의 사진 소프트 삭제 테스트")
        void softDeleteAllById_Success() {
            // given
            List<Long> idsToDelete = Arrays.asList(testPhoto1.getId(), testPhoto2.getId());

            // when
            photoRepository.softDeleteAllById(idsToDelete);
            entityManager.flush();
            entityManager.clear();

            // then
            Photo deletedPhoto1 = entityManager.find(Photo.class, testPhoto1.getId());
            Photo deletedPhoto2 = entityManager.find(Photo.class, testPhoto2.getId());
            Photo notDeletedPhoto = entityManager.find(Photo.class, testPhoto3.getId());

            assertThat(deletedPhoto1.getDeletedAt()).isNotNull();
            assertThat(deletedPhoto2.getDeletedAt()).isNotNull();
            assertThat(notDeletedPhoto.getDeletedAt()).isNull();
        }

        @Test
        @DisplayName("단일 사진 소프트 삭제 테스트")
        void softDeleteAllById_Success_SinglePhoto() {
            // given
            List<Long> idsToDelete = Arrays.asList(testPhoto1.getId());

            // when
            photoRepository.softDeleteAllById(idsToDelete);
            entityManager.flush();
            entityManager.clear();

            // then
            Photo deletedPhoto = entityManager.find(Photo.class, testPhoto1.getId());
            assertThat(deletedPhoto.getDeletedAt()).isNotNull();
        }

        @Test
        @DisplayName("빈 목록으로 삭제 요청했을때 테스트")
        void softDeleteAllById_Success_EmptyList() {
            // given
            List<Long> emptyIds = Collections.emptyList();

            // when & then
            assertThatCode(() -> {
                photoRepository.softDeleteAllById(emptyIds);
                entityManager.flush();
            }).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("존재하지 않는 ID로 삭제 테스트")
        void softDeleteAllById_Success_NonExistentIds() {
            // given
            List<Long> nonExistentIds = Arrays.asList(999L, 1000L);

            // when & then
            assertThatCode(() -> {
                photoRepository.softDeleteAllById(nonExistentIds);
                entityManager.flush();
            }).doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("findRandomByMemberId 테스트")
    class FindRandomByMemberIdTest {

        @Test
        @DisplayName("멤버의 랜덤 사진 조회 테스트")
        void findRandomByMemberId_Success() {
            // when
            List<Photo> result = photoRepository.findRandomByMemberId(testMember1.getId(), 10, 0);

            // then
            assertThat(result).isNotEmpty();
            assertThat(result).allMatch(photo -> photo.getDeletedAt() == null);
            // 속한 그룹의 모든 사진이 조회 대상
            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("멤버의 랜덤 사진 조회 1개 제한 테스트")
        void findRandomByMemberId_Success_WithSizeLimit() {
            // when
            List<Photo> result = photoRepository.findRandomByMemberId(testMember1.getId(), 1, 0);

            // then
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("사진이 없는 멤버의 랜덤 조회 테스트")
        void findRandomByMemberId_Success_NoPhotos() {
            // given
            Member memberWithNoPhotos = Member.builder()
                    .name("사진없는멤버")
                    .email("nophoto@test.com")
                    .nickname("사진없는닉네임")
                    .profileUrl("https://example.com/noprofile.jpg")
                    .provider("naver")
                    .providerId("naver_999999")
                    .identificationUrl("https://example.com/noid")
                    .build();
            entityManager.persistAndFlush(memberWithNoPhotos);

            // when
            List<Photo> result = photoRepository.findRandomByMemberId(memberWithNoPhotos.getId(), 10, 0);

            // then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("크기 0으로 랜덤 사진 요청한 경우 테스트")
        void findRandomByMemberId_Success_ZeroSize() {
            // when
            List<Photo> result = photoRepository.findRandomByMemberId(testMember1.getId(), 0, 0);

            // then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findAllPhotosByGroupIdAndOption 테스트")
    class FindAllPhotosByGroupIdAndOptionTest {

        @Test
        @DisplayName("필터링 조건 없이 그룹 사진 조회 테스트")
        void findAllPhotosByGroupIdAndOption_Success_GroupIdOnly() {
            // given
            Pageable pageable = PageRequest.of(0, 10);

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, testGroup.getId(), null, null, null, null);

            // then
            assertThat(result.getContent()).hasSize(3); // deletedPhoto는 제외
            assertThat(result.getTotalElements()).isEqualTo(3);
            assertThat(result.getContent()).allMatch(photo -> photo.getDeletedAt() == null);
            assertThat(result.getContent()).allMatch(photo -> photo.getGroup().getId().equals(testGroup.getId()));
        }

        @Test
        @DisplayName("특정 멤버가 포함된 사진만 조회하는 경우 테스트")
        void findAllPhotosByGroupIdAndOption_Success_WithMemberFilter() {
            // given
            Pageable pageable = PageRequest.of(0, 10);
            List<Long> memberIds = Arrays.asList(testMember1.getId());

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, testGroup.getId(), memberIds, null, null, null);

            // then
            assertThat(result.getContent()).hasSize(2); // testPhoto1, testPhoto3
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("특정 태그가 포함된 사진만 조회하는 경우 테스트")
        void findAllPhotosByGroupIdAndOption_Success_WithTagFilter() {
            // given
            Pageable pageable = PageRequest.of(0, 10);
            List<String> tags = Arrays.asList(tag1);

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, testGroup.getId(), null, tags, null, null);

            // then
            assertThat(result.getContent()).hasSize(2); // testPhoto1, testPhoto3 (tag1 연관)
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("날짜 범위 내의 사진만 조회하는 경우 테스트")
        void findAllPhotosByGroupIdAndOption_Success_WithDateFilter() {
            // given
            Pageable pageable = PageRequest.of(0, 10);
            LocalDate startDate = LocalDate.now().minusDays(2);
            LocalDate endDate = LocalDate.now();

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, testGroup.getId(), null, null, startDate, endDate);

            // then
            assertThat(result.getContent()).hasSize(2); // testPhoto1, testPhoto2
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("모든 필터링 조건을 조합하여 사진 조회 테스트")
        void findAllPhotosByGroupIdAndOption_Success_AllFilters() {
            // given
            Pageable pageable = PageRequest.of(0, 10);
            List<Long> memberIds = Arrays.asList(testMember1.getId());
            List<String> tags = Arrays.asList(tag1);
            LocalDate startDate = LocalDate.now().minusDays(2);
            LocalDate endDate = LocalDate.now();

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, testGroup.getId(), memberIds, tags, startDate, endDate);

            // then
            assertThat(result.getContent()).hasSize(1); // testPhoto1만 모든 조건 만족
            assertThat(result.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("그룹 사진 조회에 페이징 테스트")
        void findAllPhotosByGroupIdAndOption_Success_WithPaging() {
            // given
            Pageable pageable = PageRequest.of(0, 2);

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, testGroup.getId(), null, null, null, null);

            // then
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(3);
            assertThat(result.getTotalPages()).isEqualTo(2);
            assertThat(result.hasNext()).isTrue();
        }

        @Test
        @DisplayName("결과가 비어있는 경우 테스트")
        void findAllPhotosByGroupIdAndOption_Success_EmptyResult() {
            // given
            Pageable pageable = PageRequest.of(0, 10);
            LocalDate futureDate = LocalDate.now().plusDays(1);

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, testGroup.getId(), null, null, futureDate, futureDate);

            // then
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }

        @Test
        @DisplayName("최신순으로 정렬되었는지 테스트")
        void findAllPhotosByGroupIdAndOption_Success_OrderByTakenAtDesc() {
            // given
            Pageable pageable = PageRequest.of(0, 10);

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, testGroup.getId(), null, null, null, null);

            // then
            List<Photo> photos = result.getContent();
            assertThat(photos).hasSize(3);

            // takenAt 기준 내림차순 정렬 확인
            for (int i = 0; i < photos.size() - 1; i++) {
                assertThat(photos.get(i).getTakenAt())
                        .isAfterOrEqualTo(photos.get(i + 1).getTakenAt());
            }
        }

        @Test
        @DisplayName("존재하지 않는 그룹의 사진을 테스트")
        void findAllPhotosByGroupIdAndOption_Success_NonExistentGroup() {
            // given
            Pageable pageable = PageRequest.of(0, 10);

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, 999L, null, null, null, null);

            // then
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }

        @Test
        @DisplayName("필터링 조건이 비어있는 경우 그룹 사진 조회 테스트")
        void findAllPhotosByGroupIdAndOption_Success_EmptyFilters() {
            // given
            Pageable pageable = PageRequest.of(0, 10);
            List<Long> emptyMemberIds = Collections.emptyList();
            List<String> emptyTags = Collections.emptyList();

            // when
            Page<Photo> result = photoRepository.findAllPhotosByGroupIdAndOption(
                    pageable, testGroup.getId(), emptyMemberIds, emptyTags, null, null);

            // then
            assertThat(result.getContent()).hasSize(3); // 빈 목록은 필터링 안함
            assertThat(result.getTotalElements()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("findBlurryPhotosByGroupIdTest 테스트")
    class findBlurryPhotosByGroupIdTest {
        @Test
        @DisplayName("그룹의 사진 중 흐린 사진을 조회합니다.")
        void findBlurryPhotosByGroupId() {
            // given
            Pageable pageable = PageRequest.of(0, 10);
            testPhoto1.updateBlurred();
            testPhoto2.updateBlurred();

            photoRepository.saveAll(List.of(testPhoto1, testPhoto2));

            // when
            Page<Photo> result = photoRepository.findBlurryPhotosByGroupId(testGroup.getId(), pageable);

            // then
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
        }
    }
    
    @Nested
    @DisplayName("findPhotoIdNotInAnyAlbum 테스트")
    class findPhotoIdNotInAnyAlbumTest {
        @Test
        @DisplayName("어떤 앨범에도 속하지 않은 사진의 ID를 조회합니다.")
        void findPhotoIdNotInAnyAlbum() {
            // given
            entityManager.persist(TimelineAlbum.createTimelineAlbum(testGroup, List.of(testPhoto1)));
            TierAlbum tierAlbum = TierAlbum.createTierAlbum(testGroup.getId());
            entityManager.persist(tierAlbum);
            entityManager.persist(TierAlbumPhoto.createTierAlbumPhoto(tierAlbum, testPhoto2, Tier.S, 1));

            // when
            List<Long> photoIdNotInAnyAlbum = photoRepository.findPhotoIdNotInAnyAlbum(List.of(testPhoto1.getId(), testPhoto2.getId(), testPhoto3.getId(), deletedPhoto.getId()));

            // then
            assertThat(photoIdNotInAnyAlbum).hasSize(1);
            assertThat(photoIdNotInAnyAlbum).contains(testPhoto3.getId());
            assertThat(photoIdNotInAnyAlbum).doesNotContain(testPhoto1.getId(), testPhoto2.getId(), deletedPhoto.getId());
        }
    }
    
    @Nested
    @DisplayName("findSimilarClusters 테스트")
    class findSimilarClustersTest {
        @Test
        @DisplayName("유사한 사진 그룹을 조회합니다.")
        void findSimilarClusters() {
            // given
            Pageable pageable = PageRequest.of(0, 10);
            testPhoto1.updateClusterId(101L);
            testPhoto2.updateClusterId(101L);
            testPhoto3.updateClusterId(102L);
            deletedPhoto.updateClusterId(102L);

            photoRepository.saveAll(List.of(testPhoto1, testPhoto2, testPhoto3, deletedPhoto));

            // when
            Page<PhotoClusterDto> result = photoRepository.findSimilarClusters(testGroup.getId(), pageable);

            // then
            assertThat(result.getContent()).hasSize(2);

            PhotoClusterDto dto1 = result.getContent().get(0);
            assertThat(dto1.getClusterId()).isEqualTo(101L);
            assertThat(dto1.getPhotoCount()).isEqualTo(2);

            PhotoClusterDto dto2 = result.getContent().get(1);
            assertThat(dto2.getClusterId()).isEqualTo(102L);
            assertThat(dto2.getPhotoCount()).isEqualTo(1);
        }

    }

}