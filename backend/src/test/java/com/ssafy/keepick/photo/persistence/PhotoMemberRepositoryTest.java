package com.ssafy.keepick.photo.persistence;

import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.domain.GroupMember;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.persistence.GroupRepository;
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

    @Autowired GroupRepository groupRepository;
    @Autowired GroupMemberRepository groupMemberRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired PhotoRepository photoRepository;
    @Autowired PhotoMemberRepository photoMemberRepository;

    @DisplayName("사진에 태그된 멤버를 조회합니다.")
    @Test
    void findAllByPhotoIdTest() {
        // given
        Group group = groupRepository.save(Group.createGroup("Test", null));

        Member member1 = memberRepository.save(createMember(1));
        Member member2 = memberRepository.save(createMember(2));
        Member member3 = memberRepository.save(createMember(3));

        GroupMember groupMember1 = groupMemberRepository.save(GroupMember.createGroupMember(group, member1)); groupMember1.accept();
        GroupMember groupMember2 = groupMemberRepository.save(GroupMember.createGroupMember(group, member2)); groupMember2.accept();
        GroupMember groupMember3 = groupMemberRepository.save(GroupMember.createGroupMember(group, member3)); // 그룹 가입X

        Photo photo = photoRepository.save(Photo.builder().group(group).build());

        photoMemberRepository.save(PhotoMember.of(photo, member1));
        photoMemberRepository.save(PhotoMember.of(photo, member2));
        photoMemberRepository.save(PhotoMember.of(photo, member3));

        // when
        List<PhotoMember> photoMembers = photoMemberRepository.findAllByPhotoId(group.getId(), photo.getId());

        // then
        // 그룹에 가입하지 않은 회원은 조회X
        assertThat(photoMembers.size()).isEqualTo(2);
        assertThat(photoMembers).extracting("member").contains(member1, member2);
    }

    @DisplayName("그룹에 속한 사진에 태그된 모든 멤버를 조회합니다.")
    @Test
    void findMembersByGroupIdTest() {
        // given
        Group group = groupRepository.save(Group.createGroup("Test", null));

        Member member1 = memberRepository.save(createMember(1));
        Member member2 = memberRepository.save(createMember(2));
        Member member3 = memberRepository.save(createMember(3));

        GroupMember groupMember1 = groupMemberRepository.save(GroupMember.createGroupMember(group, member1)); groupMember1.accept();
        GroupMember groupMember2 = groupMemberRepository.save(GroupMember.createGroupMember(group, member2)); groupMember2.accept();
        GroupMember groupMember3 = groupMemberRepository.save(GroupMember.createGroupMember(group, member3)); // 그룹 가입X

        Photo photo1 = photoRepository.save(Photo.builder().group(group).build());
        Photo photo2 = photoRepository.save(Photo.builder().group(group).build());

        photoMemberRepository.save(PhotoMember.of(photo1, member1));
        photoMemberRepository.save(PhotoMember.of(photo1, member2));
        photoMemberRepository.save(PhotoMember.of(photo2, member2));
        photoMemberRepository.save(PhotoMember.of(photo2, member3));

        // when
        List<Member> photoMembers = photoMemberRepository.findMembersByGroupId(group.getId());

        // then
        // 중복X, 그룹에 가입하지 않은 회원은 조회X
        assertThat(photoMembers.size()).isEqualTo(2);
        assertThat(photoMembers).contains(member1, member2);
    }

    Member createMember(int i) {
        return Member.builder().name("test" + i).email("email" + i).nickname("nick" + i).provider("google" + i).providerId("pid" + i).identificationUrl("url" + i).build();
    }

}