package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.domain.PhotoTag;
import com.ssafy.keepick.support.BaseRepositoryTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class PhotoTagRepositoryTest extends BaseRepositoryTest {

    @Autowired PhotoRepository photoRepository;
    @Autowired PhotoTagRepository photoTagRepository;
    @Autowired GroupRepository groupRepository;
    @Autowired MemberRepository memberRepository;

    @DisplayName("사진의 태그를 조회합니다.")
    @Test
    void findAllByPhotoIdTest() {
        // given
        Photo photo = photoRepository.save(Photo.builder().build());

        photoTagRepository.save(PhotoTag.of(photo, "태그1"));
        photoTagRepository.save(PhotoTag.of(photo, "태그2"));
        photoTagRepository.save(PhotoTag.of(photo, "태그3"));

        // when
        List<PhotoTag> photoTags = photoTagRepository.findAllByPhotoId(photo.getId());

        // then
        assertThat(photoTags.size()).isEqualTo(3);
        assertThat(photoTags).extracting("tag").containsExactly("태그1", "태그2", "태그3");
    }

    @DisplayName("그룹갤러리의 모든 고유한 태그를 조회합니다.")
    @Test
    void findTagsByGroupIdTest() {
        // given
        Member member = memberRepository.save(createMember());
        Group group = groupRepository.save(Group.createGroup("그룹 이름", member));
        Photo photo = photoRepository.save(Photo.builder().group(group).build());

        photoTagRepository.save(PhotoTag.of(photo, "태그1"));
        photoTagRepository.save(PhotoTag.of(photo, "태그2"));
        photoTagRepository.save(PhotoTag.of(photo, "태그3"));
        photoTagRepository.save(PhotoTag.of(photo, "태그3"));

        // when
        List<String> photoTags = photoTagRepository.findTagsByGroupId(group.getId());

        // then
        assertThat(photoTags.size()).isEqualTo(3);
        assertThat(photoTags).containsExactly("태그1", "태그2", "태그3");
    }

    Member createMember() {
        return Member.builder()
                .name("이름")
                .email("unique@email.com")
                .nickname("닉네임")
                .provider("google")
                .providerId("123456789")
                .identificationUrl("http://example.png")
                .build();
    }

}