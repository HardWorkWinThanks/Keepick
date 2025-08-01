package com.ssafy.keepick.service.group;

import com.ssafy.keepick.common.exception.BaseException;
import com.ssafy.keepick.controller.group.request.GroupCreateRequest;
import com.ssafy.keepick.entity.Group;
import com.ssafy.keepick.entity.GroupMember;
import com.ssafy.keepick.entity.GroupMemberStatus;
import com.ssafy.keepick.entity.Member;
import com.ssafy.keepick.repository.GroupMemberRepository;
import com.ssafy.keepick.repository.GroupRepository;
import com.ssafy.keepick.repository.MemberRepository;
import com.ssafy.keepick.service.group.dto.GroupDto;
import com.ssafy.keepick.service.group.dto.GroupMemberDto;
import com.ssafy.keepick.service.group.dto.MemberDto;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class GroupServiceTest {

    @Autowired
    GroupRepository groupRepository;

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    GroupMemberRepository groupMemberRepository;

    @Autowired
    GroupService groupService;


    @DisplayName("그룹을 생성한다 - 생성 시 회원 수는 1명이다")
    @Test
    void createGroupTest() {
        // given
        Member creator = createMember(0);
        memberRepository.save(creator);

        GroupCreateRequest request = GroupCreateRequest.builder().name("테스트 그룹").build();

        // when
        GroupDto groupDto = groupService.createGroup(request, creator.getId());

        // then
        assertThat(groupDto.getName()).isEqualTo(request.getName());

        // 생성된 그룹 검증
        Group group = groupRepository.findById(groupDto.getGroupId()).get();
        assertThat(group.getName()).isEqualTo(request.getName());
        assertThat(group.getCreatedAt()).isNotNull();
        assertThat(group.getMemberCount()).isEqualTo(1);
        assertThat(group.getCreator().getId()).isEqualTo(creator.getId());

        // 그룹 생성자는 생성 시 그룹에 가입한다.
        List<Long> memberIds = groupMemberRepository.findJoinedMembersById(groupDto.getGroupId()).stream().map(gm -> gm.getMember().getId()).toList();
        assertThat(memberIds.size()).isEqualTo(1);
        assertThat(memberIds).contains(creator.getId());
    }

    @DisplayName("내가 가입한/거절한/초대받은 그룹 목록을 조회한다 - 탈퇴한 그룹은 조회되지 않는다")
    @Test
    void getGroupsTest() {
        // given
        Member member = createMember(1);
        memberRepository.save(member);

        Group group1 = Group.createGroup("그룹1", null);
        Group group2 = Group.createGroup("그룹2", null);
        Group group3 = Group.createGroup("그룹3", null);
        Group group4 = Group.createGroup("그룹4", null);
        groupRepository.save(group1);
        groupRepository.save(group2);
        groupRepository.save(group3);
        groupRepository.save(group4);

        GroupMember groupMember1 = GroupMember.createGroupMember(group1, member);
        GroupMember groupMember2 = GroupMember.createGroupMember(group2, member); groupMember2.accept();
        GroupMember groupMember3 = GroupMember.createGroupMember(group3, member); groupMember3.reject();
        GroupMember groupMember4 = GroupMember.createGroupMember(group4, member); groupMember4.accept(); groupMember4.leave();
        groupMemberRepository.save(groupMember1);
        groupMemberRepository.save(groupMember2);
        groupMemberRepository.save(groupMember3);
        groupMemberRepository.save(groupMember4);


        // when
        List<GroupMemberDto> invitedGroups = groupService.getGroupList(member.getId(), GroupMemberStatus.PENDING);
        List<GroupMemberDto> acceptedGroups = groupService.getGroupList(member.getId(), GroupMemberStatus.ACCEPTED);
        List<GroupMemberDto> rejectedGroups = groupService.getGroupList(member.getId(), GroupMemberStatus.REJECTED);

        // then
        assertThat(invitedGroups).extracting("groupId").contains(group1.getId());
        assertThat(acceptedGroups).extracting("groupId").contains(group2.getId()).doesNotContain(group4.getId());
        assertThat(rejectedGroups).extracting("groupId").contains(group3.getId());
    }

    @DisplayName("그룹을 조회한다")
    @Test
    void getGroupTest() {
        // given
        Member member = createMember(1);
        memberRepository.save(member);

        Group group = Group.createGroup(" 테스트 그룹", member);
        groupRepository.save(group);

        // when
        GroupDto groupDto = groupService.getGroup(group.getId());

        // then
        assertThat(groupDto.getName()).isEqualTo(group.getName());
        assertThat(groupDto.getCreatorId()).isEqualTo(member.getId());
    }

    @DisplayName("그룹에 가입한 회원을 조회한다")
    @Test
    void getMembersTest() {
        // given
        Member member1 = createMember(1);
        Member member2 = createMember(2);
        Member member3 = createMember(3);
        Member member4 = createMember(4);
        memberRepository.save(member1);
        memberRepository.save(member2);
        memberRepository.save(member3);
        memberRepository.save(member4);

        Group group = Group.createGroup("테스트 그룹", null);
        groupRepository.save(group);

        GroupMember groupMember1 = GroupMember.createGroupMember(group, member1);
        GroupMember groupMember2 = GroupMember.createGroupMember(group, member2); groupMember2.accept();
        GroupMember groupMember3 = GroupMember.createGroupMember(group, member3); groupMember3.reject();
        GroupMember groupMember4 = GroupMember.createGroupMember(group, member4); groupMember4.accept(); groupMember4.leave();
        groupMemberRepository.save(groupMember1);
        groupMemberRepository.save(groupMember2);
        groupMemberRepository.save(groupMember3);
        groupMemberRepository.save(groupMember4);

        // when
        List<MemberDto> members = groupService.getGroupMembers(group.getId());

        // then
        assertThat(members).extracting("memberId").containsExactly(member2.getId()).doesNotContain(member1.getId(), member3.getId(), member4.getId());
    }

    @DisplayName("회원이 그룹에서 탈퇴한다")
    @Test
    void leaveGroupTest() {
        // given
        Member member = createMember(1);
        memberRepository.save(member);

        Group group = Group.createGroup("테스트 그룹", null);
        groupRepository.save(group);

        GroupMember groupMember = GroupMember.createGroupMember(group, member); groupMember.accept();
        groupMemberRepository.save(groupMember);

        // when
        groupService.leaveGroup(group.getId(), member.getId());

        // then
        List<MemberDto> members = groupService.getGroupMembers(group.getId());
        assertThat(members).extracting("memberId").doesNotContain(member.getId());
    }

    @DisplayName("가입하지 않은 그룹을 탈퇴할 수 없다")
    @Test
    void leaveNotJoinedGroupTest() {
        // given
        Member member1 = createMember(1);
        Member member2 = createMember(2);
        memberRepository.save(member1);
        memberRepository.save(member2);

        Group group = Group.createGroup("테스트 그룹", null);
        groupRepository.save(group);

        GroupMember groupMember1 = GroupMember.createGroupMember(group, member1); groupMember1.accept(); groupMember1.leave(); // 그룹 탈퇴한 회원
        GroupMember groupMember2 = GroupMember.createGroupMember(group, member2); // 그룹 초대 수락 안 한 회원
        groupMemberRepository.save(groupMember1);
        groupMemberRepository.save(groupMember2);

        // when & then
        assertThrows(BaseException.class, () -> groupService.leaveGroup(group.getId(), member1.getId()));
        assertThrows(BaseException.class, () -> groupService.leaveGroup(group.getId(), member2.getId()));
    }

    Member createMember(int i) {
        return Member.builder().name("test" + i).email("email" + i).nickname("nick" + i).provider("google" + i).providerId("pid" + i).identificationUrl("url" + i).build();
    }

}