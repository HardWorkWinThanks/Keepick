package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.domain.PhotoMember;
import com.ssafy.keepick.support.BaseRepositoryTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PhotoMemberRepositoryTest extends BaseRepositoryTest {

    @Autowired MemberRepository memberRepository;
    @Autowired PhotoRepository photoRepository;
    @Autowired PhotoMemberRepository photoMemberRepository;

    @DisplayName("사진에 태그된 멤버를 조회합니다.")
    @Test
    void findAllByPhotoIdTest() {
        // given
        Member member1 = memberRepository.save(createMember(1));
        Member member2 = memberRepository.save(createMember(2));
        Member member3 = memberRepository.save(createMember(3));

        Photo photo = photoRepository.save(Photo.builder().build());

        photoMemberRepository.save(PhotoMember.of(photo, member1));
        photoMemberRepository.save(PhotoMember.of(photo, member2));
        photoMemberRepository.save(PhotoMember.of(photo, member3));

        // when
        List<PhotoMember> photoMembers = photoMemberRepository.findAllByPhotoId(photo.getId());

        // then
        assertThat(photoMembers.size()).isEqualTo(3);
        assertThat(photoMembers).extracting("member").contains(member1, member2, member3);
    }

    Member createMember(int i) {
        return Member.builder().name("test" + i).email("email" + i).nickname("nick" + i).provider("google" + i).providerId("pid" + i).identificationUrl("url" + i).build();
    }

}