package com.ssafy.keepick.repository;

import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.domain.GroupMember;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
class GroupMemberRepositoryTest {

    @Autowired EntityManager em;
    @Autowired
    GroupMemberRepository groupMemberRepository;
    @Autowired
    MemberRepository memberRepository;
    @Autowired
    GroupRepository groupRepository;

    @Test
    void findByGroupIdAndMemberIdTest() {
        // given
        Member member1 = Member.builder().name("test1").email("email1").nickname("nick1").provider("google").providerId("1111").identificationUrl("url").build();
        Member member2 = Member.builder().name("test2").email("email2").nickname("nick2").provider("google").providerId("2222").identificationUrl("url").build();

        memberRepository.save(member1);
        memberRepository.save(member2);

        Group group1 = Group.createGroup("testGroup1", null);

        groupRepository.save(group1);

        GroupMember groupMember1 = GroupMember.createGroupMember(group1, member1);
        groupMember1.accept();

        groupMemberRepository.save(groupMember1);

        // when
        Optional<GroupMember> findGroupMember1 = groupMemberRepository.findByGroupIdAndMemberId(group1.getId(), member1.getId());
        Optional<GroupMember> findGroupMember2 = groupMemberRepository.findByGroupIdAndMemberId(group1.getId(), member2.getId());

        // then
        assertThat(findGroupMember1).hasValue(groupMember1);
        assertThat(findGroupMember1).hasValue(groupMember1);
    }

    @Test
    void findByGroupIdAndMemberIdAndStatusTest() {
        // given
        Member member1 = Member.builder().name("test1").email("email1").nickname("nick1").provider("google").providerId("1111").identificationUrl("url").build();

        memberRepository.save(member1);

        Group group1 = Group.createGroup("testGroup1", null);
        Group group2 = Group.createGroup("testGroup2", null);
        Group group3 = Group.createGroup("testGroup3", null);
        groupRepository.save(group1);
        groupRepository.save(group2);
        groupRepository.save(group3);

        GroupMember groupMember1 = GroupMember.createGroupMember(group1, member1);
        GroupMember groupMember2 = GroupMember.createGroupMember(group2, member1);
        GroupMember groupMember3 = GroupMember.createGroupMember(group3, member1);;
        groupMember2.accept();
        groupMember3.reject();

        groupMemberRepository.save(groupMember1);
        groupMemberRepository.save(groupMember2);
        groupMemberRepository.save(groupMember3);

        // when
        GroupMember findGroupMember1 = groupMemberRepository.findByGroupIdAndMemberIdAndStatus(group1.getId(), member1.getId(), GroupMemberStatus.PENDING).get();
        GroupMember findGroupMember2 = groupMemberRepository.findByGroupIdAndMemberIdAndStatus(group2.getId(), member1.getId(), GroupMemberStatus.ACCEPTED).get();
        GroupMember findGroupMember3 = groupMemberRepository.findByGroupIdAndMemberIdAndStatus(group3.getId(), member1.getId(), GroupMemberStatus.REJECTED).get();

        // then
        assertThat(findGroupMember1).isEqualTo(groupMember1);
        assertThat(findGroupMember2).isEqualTo(groupMember2);
        assertThat(findGroupMember3).isEqualTo(groupMember3);
    }

    @Test
    void findByMemberIdAndStatusTest() {
        // given
        Member member1 = Member.builder().name("test1").email("email1").nickname("nick1").provider("google").providerId("1111").identificationUrl("url").build();

        memberRepository.save(member1);

        Group group1 = Group.createGroup("testGroup1", null);
        Group group2 = Group.createGroup("testGroup2", null);;
        Group group3 = Group.createGroup("testGroup3", null);;
        groupRepository.save(group1);
        groupRepository.save(group2);
        groupRepository.save(group3);

        GroupMember groupMember1 = GroupMember.createGroupMember(group1, member1);
        GroupMember groupMember2 = GroupMember.createGroupMember(group2, member1);
        GroupMember groupMember3 = GroupMember.createGroupMember(group3, member1);
        groupMember2.accept();
        groupMember3.reject();

        groupMemberRepository.save(groupMember1);
        groupMemberRepository.save(groupMember2);
        groupMemberRepository.save(groupMember3);

        // when
        List<GroupMember> findGroupMembers1 = groupMemberRepository.findGroupsByMember(member1.getId(), GroupMemberStatus.PENDING);
        List<GroupMember> findGroupMembers2 = groupMemberRepository.findGroupsByMember(member1.getId(), GroupMemberStatus.ACCEPTED);
        List<GroupMember> findGroupMembers3 = groupMemberRepository.findGroupsByMember(member1.getId(), GroupMemberStatus.REJECTED);

        // then
        assertThat(findGroupMembers1).hasSize(1)
                .extracting("status")
                .containsOnly(GroupMemberStatus.PENDING);

        assertThat(findGroupMembers2).hasSize(1)
                .extracting("status")
                .containsOnly(GroupMemberStatus.ACCEPTED);

        assertThat(findGroupMembers3).hasSize(1)
                .extracting("status")
                .containsOnly(GroupMemberStatus.REJECTED);
    }

    @Test
    void findMembersByIdTest() {
        // given
        Member member1 = Member.builder().name("test1").email("email1").nickname("nick1").provider("google").providerId("1111").identificationUrl("url").build();
        Member member2 = Member.builder().name("test2").email("email2").nickname("nick2").provider("google").providerId("2222").identificationUrl("url").build();
        Member member3 = Member.builder().name("test3").email("email3").nickname("nick3").provider("google").providerId("3333").identificationUrl("url").build();

        memberRepository.save(member1);
        memberRepository.save(member2);
        memberRepository.save(member3);

        Group group1 = Group.createGroup("testGroup1", null);
        Group group2 = Group.createGroup("testGroup2", null);

        groupRepository.save(group1);
        groupRepository.save(group2);

        GroupMember groupMember1 = GroupMember.createGroupMember(group1, member1);
        GroupMember groupMember2 = GroupMember.createGroupMember(group1, member2);
        GroupMember groupMember3 = GroupMember.createGroupMember(group2, member3);
        groupMember1.accept();
        groupMember2.accept();
        groupMember3.accept();

        groupMemberRepository.save(groupMember1);
        groupMemberRepository.save(groupMember2);
        groupMemberRepository.save(groupMember3);

        // when
        List<GroupMember> findMembers1 = groupMemberRepository.findJoinedMembersById(group1.getId());
        List<GroupMember> findMembers2 = groupMemberRepository.findJoinedMembersById(group2.getId());

        // then
        assertThat(findMembers1)
                .hasSize(2)
                .containsExactly(groupMember1, groupMember2);

        assertThat(findMembers2)
                .hasSize(1)
                .containsExactly(groupMember3);
    }
}