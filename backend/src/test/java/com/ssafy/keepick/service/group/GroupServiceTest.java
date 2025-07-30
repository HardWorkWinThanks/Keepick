package com.ssafy.keepick.service.group;

import com.ssafy.keepick.common.exception.BaseException;
import com.ssafy.keepick.entity.Group;
import com.ssafy.keepick.entity.GroupMember;
import com.ssafy.keepick.entity.GroupMemberStatus;
import com.ssafy.keepick.entity.Member;
import com.ssafy.keepick.repository.GroupMemberRepository;
import com.ssafy.keepick.repository.GroupRepository;
import com.ssafy.keepick.repository.MemberRepository;
import com.ssafy.keepick.service.RedisService;
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
    @Autowired
    RedisService redisService;


    @DisplayName("그룹을 생성한다 - 생성 시 회원 수는 1명이고 초대한 회원 수는 N명이다")
    @Test
    void createGroupTest() {
        // given
        Member creator = createMember(0);
        Member invitee1 = createMember(1);
        Member invitee2 = createMember(2);
        Member invitee3 = createMember(3);
        memberRepository.save(creator);
        memberRepository.save(invitee1);
        memberRepository.save(invitee2);
        memberRepository.save(invitee3);

        GroupCommand.Create command = GroupCommand.Create.builder().name("테스트 그룹").memberId(creator.getId()).members(List.of(invitee1.getId(), invitee2.getId(), invitee3.getId())).build();

        // when
        GroupResult.GroupInfo result = groupService.createGroup(command);

        // then
        assertThat(result.getName()).isEqualTo(command.getName());

        // 생성된 그룹 검증
        Group group = groupRepository.findById(result.getGroupId()).get();
        assertThat(group.getName()).isEqualTo(command.getName());
        assertThat(group.getCreatedAt()).isNotNull();
        assertThat(group.getMemberCount()).isEqualTo(1);
        assertThat(group.getCreator().getId()).isEqualTo(creator.getId());

        // 그룹 생성자는 생성 시 그룹에 가입한다.
        List<Long> memberIds = groupMemberRepository.findJoinedMembersById(result.getGroupId()).stream().map(gm -> gm.getMember().getId()).toList();
        assertThat(memberIds.size()).isEqualTo(1);
        assertThat(memberIds).contains(creator.getId());

        // 그룹 생성 시 초대한 회원들은 그룹에 초대받는다. (가입X)
        List<Long> inviteeIds = groupMemberRepository.findByGroupId(group.getId()).stream().filter(gm -> gm.getStatus() == GroupMemberStatus.PENDING).map(gm -> gm.getMember().getId()).toList();
        assertThat(inviteeIds.size()).isEqualTo(3);
        assertThat(inviteeIds).containsExactly(invitee1.getId(), invitee2.getId(), invitee3.getId());
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

        GroupMember groupMember1 = GroupMember.createGroupMember(group1, member, GroupMemberStatus.PENDING);
        GroupMember groupMember2 = GroupMember.createGroupMember(group2, member, GroupMemberStatus.ACCEPTED);
        GroupMember groupMember3 = GroupMember.createGroupMember(group3, member, GroupMemberStatus.REJECTED);
        GroupMember groupMember4 = GroupMember.createGroupMember(group4, member, GroupMemberStatus.ACCEPTED);
        groupMemberRepository.save(groupMember1);
        groupMemberRepository.save(groupMember2);
        groupMemberRepository.save(groupMember3);
        groupMemberRepository.save(groupMember4);
        groupMember4.delete();

        // when
        List<GroupResult.GroupMemberInfo> invitedGroups = groupService.getGroups(new GroupCommand.MyGroup(member.getId(), GroupMemberStatus.PENDING));
        List<GroupResult.GroupMemberInfo> acceptedGroups = groupService.getGroups(new GroupCommand.MyGroup(member.getId(), GroupMemberStatus.ACCEPTED));
        List<GroupResult.GroupMemberInfo> rejectedGroups = groupService.getGroups(new GroupCommand.MyGroup(member.getId(), GroupMemberStatus.REJECTED));

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
        GroupResult.GroupInfo result = groupService.getGroup(group.getId());

        // then
        assertThat(result.getName()).isEqualTo(group.getName());
        assertThat(result.getCreatorId()).isEqualTo(member.getId());
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

        GroupMember groupMember1 = GroupMember.createGroupMember(group, member1, GroupMemberStatus.PENDING);
        GroupMember groupMember2 = GroupMember.createGroupMember(group, member2, GroupMemberStatus.ACCEPTED);
        GroupMember groupMember3 = GroupMember.createGroupMember(group, member3, GroupMemberStatus.REJECTED);
        GroupMember groupMember4 = GroupMember.createGroupMember(group, member4, GroupMemberStatus.ACCEPTED);
        groupMemberRepository.save(groupMember1);
        groupMemberRepository.save(groupMember2);
        groupMemberRepository.save(groupMember3);
        groupMemberRepository.save(groupMember4);
        groupMember4.delete();

        // when
        List<GroupResult.Member> members = groupService.getMembers(group.getId());

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

        GroupMember groupMember = GroupMember.createGroupMember(group, member, GroupMemberStatus.ACCEPTED);
        groupMemberRepository.save(groupMember);

        GroupCommand.Leave command1 = new GroupCommand.Leave(group.getId(), member.getId());

        // when
        groupService.leaveGroup(command1);

        // then
        List<GroupResult.Member> members = groupService.getMembers(group.getId());
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

        GroupMember groupMember1 = GroupMember.createGroupMember(group, member1, GroupMemberStatus.ACCEPTED); // 그룹 탈퇴한 회원
        GroupMember groupMember2 = GroupMember.createGroupMember(group, member2, GroupMemberStatus.PENDING); // 그룹 초대 수락 안 한 회원
        groupMember1.delete();
        groupMemberRepository.save(groupMember1);
        groupMemberRepository.save(groupMember2);

        GroupCommand.Leave command1 = new GroupCommand.Leave(group.getId(), member1.getId());
        GroupCommand.Leave command2 = new GroupCommand.Leave(group.getId(), member2.getId());

        // when & then
        assertThrows(BaseException.class, () -> groupService.leaveGroup(command1));
        assertThrows(BaseException.class, () -> groupService.leaveGroup(command2));
    }

    @DisplayName("회원을 그룹에 초대한다")
    @Test
    void inviteTest() {
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

        groupMemberRepository.save(GroupMember.createGroupMember(group, member3, GroupMemberStatus.REJECTED)); // 그룹 초대 거절한 회원
        GroupMember groupMember = GroupMember.createGroupMember(group, member4, GroupMemberStatus.ACCEPTED); // 그룹 탈퇴한 회원
        groupMember.delete();
        groupMemberRepository.save(groupMember);


        GroupCommand.Invite command = new GroupCommand.Invite(group.getId(), List.of(member1.getId(), member2.getId(), member3.getId(), member4.getId()));

        // when
        List<GroupResult.GroupMemberInfo> result = groupService.invite(command);
        GroupMember groupMember1 = groupMemberRepository.findByGroupIdAndMemberId(group.getId(), member1.getId()).get();
        GroupMember groupMember2 = groupMemberRepository.findByGroupIdAndMemberId(group.getId(), member2.getId()).get();
        GroupMember groupMember3 = groupMemberRepository.findByGroupIdAndMemberId(group.getId(), member3.getId()).get();
        GroupMember groupMember4 = groupMemberRepository.findByGroupIdAndMemberId(group.getId(), member4.getId()).get();

        // then
        assertThat(groupMember1.getStatus()).isEqualTo(GroupMemberStatus.PENDING);
        assertThat(groupMember2.getStatus()).isEqualTo(GroupMemberStatus.PENDING);
        assertThat(groupMember3.getStatus()).isEqualTo(GroupMemberStatus.PENDING);
        assertThat(groupMember4.getStatus()).isEqualTo(GroupMemberStatus.PENDING);
        assertThat(groupMember4.getDeletedAt()).isNull();
    }

    @DisplayName("이미 그룹에 가입한 회원을 초대할 수 없다")
    @Test
    void inviteDuplicateMemberTest() {
        // given
        Member member = createMember(1);
        memberRepository.save(member);

        Group group = Group.createGroup("테스트 그룹", null);
        groupRepository.save(group);

        groupMemberRepository.save(GroupMember.createGroupMember(group, member, GroupMemberStatus.ACCEPTED));

        GroupCommand.Invite command = new GroupCommand.Invite(group.getId(), List.of(member.getId()));

        // when & then
        assertThrows(BaseException.class, () -> groupService.invite(command));
    }

    @DisplayName("그룹 초대를 수락한다")
    @Test
    void acceptInvitationTest() {
        // given
        Member member = createMember(1);
        memberRepository.save(member);

        Group group = Group.createGroup("테스트 그룹", null);
        groupRepository.save(group);

        GroupMember groupMember = GroupMember.createGroupMember(group, member);
        groupMemberRepository.save(groupMember);

        // when
        GroupResult.GroupMemberInfo result = groupService.acceptInvitation(groupMember.getId());
        List<Long> joinedMemberIds = groupMemberRepository.findJoinedMembersById(group.getId()).stream().map(gm -> gm.getMember().getId()).toList();

        // then
        assertThat(result.getStatus()).isEqualTo(GroupMemberStatus.ACCEPTED.name());
        assertThat(joinedMemberIds).containsExactly(member.getId());

        assertThrows(BaseException.class, () -> groupService.acceptInvitation(1234567L));
    }

    @DisplayName("그룹 초대를 거절한다")
    @Test
    void rejectInvitationTest() {
        // given
        Member member = createMember(1);
        memberRepository.save(member);

        Group group = Group.createGroup("테스트 그룹", null);
        groupRepository.save(group);

        GroupMember groupMember = GroupMember.createGroupMember(group, member);
        groupMemberRepository.save(groupMember);

        // when
        GroupResult.GroupMemberInfo result = groupService.rejectInvitation(groupMember.getId());
        List<Long> rejectGroupIds = groupMemberRepository.findGroupsByMember(member.getId(), GroupMemberStatus.REJECTED).stream().map(gm -> gm.getGroup().getId()).toList();

        // then
        assertThat(result.getStatus()).isEqualTo(GroupMemberStatus.REJECTED.name());
        assertThat(rejectGroupIds).containsExactly(group.getId());

        assertThrows(BaseException.class, () -> groupService.rejectInvitation(1234567L));
    }

    @DisplayName("그룹 초대 링크를 생성한다")
    @Test
    void createInvitationLinkTest() throws Exception {
        // given
        Member member = createMember(1);
        memberRepository.save(member);

        Group group = Group.createGroup("테스트 그룹", null);
        groupRepository.save(group);

        // when
        GroupResult.Link result = groupService.createInvitationLink(group.getId());

        // then
        String value = redisService.getValue("invite:"+result.getToken());
        assertThat(value).isEqualTo(group.getId().toString());

//        Thread.sleep(5000);
//        String timeoutValue = redisService.getValue("invite:"+result.getToken());
//        assertThat(timeoutValue).isNull();
    }

    @DisplayName("그룹 초대 링크로 그룹에 가입한다")
    @Test
    void joinGroupByInvitationLinkTest() {
        // given
        Member member = createMember(1);
        memberRepository.save(member);

        Group group = Group.createGroup("테스트 그룹", null);
        groupRepository.save(group);

        String inviteToken = groupService.createInvitationLink(group.getId()).getToken();

        GroupCommand.Link command = new GroupCommand.Link(group.getId(), member.getId(), inviteToken);

        // when
        GroupResult.GroupMemberInfo result = groupService.joinGroupByInvitationLink(command);

        // then
        List<Group> groups = groupMemberRepository.findGroupsByMember(member.getId(), GroupMemberStatus.ACCEPTED).stream().map(gm -> gm.getGroup()).toList();
        assertThat(groups).extracting("id").contains(group.getId());
    }

    Member createMember(int i) {
        return Member.builder().name("test" + i).email("email" + i).nickname("nick" + i).provider("google" + i).providerId("pid" + i).identificationUrl("url" + i).build();
    }
}