package com.ssafy.keepick.service.group;

import com.ssafy.keepick.common.exception.BaseException;
import com.ssafy.keepick.entity.Group;
import com.ssafy.keepick.entity.GroupMember;
import com.ssafy.keepick.entity.GroupMemberStatus;
import com.ssafy.keepick.entity.Member;
import com.ssafy.keepick.repository.GroupMemberRepository;
import com.ssafy.keepick.repository.GroupRepository;
import com.ssafy.keepick.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.ssafy.keepick.common.exception.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public GroupResult.GroupInfo createGroup(GroupCommand.Create command) {
        // 그룹 생성
        Member member = memberRepository.findById(command.getMemberId()).orElseThrow(() -> new BaseException(NOT_FOUND));
        Group group = Group.createGroup(command.getName(), member);
        groupRepository.save(group);
        // 그룹에 가입 & 초대
        createGroupWithInvitees(group, member, command.getMemberIds());
        GroupResult.GroupInfo result = GroupResult.GroupInfo.from(group);
        return result;
    }

    public List<GroupResult.GroupMemberInfo> getGroups(GroupCommand.MyGroup command) {
        List<GroupMember> groupMembers = groupMemberRepository.findGroupsByMember(command.getMemberId(), command.getStatus());
        List<GroupResult.GroupMemberInfo> result = groupMembers.stream().map(GroupResult.GroupMemberInfo::from).toList();
        return result;
    }

    public GroupResult.GroupInfo getGroup(Long groupId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        GroupResult.GroupInfo result = GroupResult.GroupInfo.from(group);
        return result;
    }

    public List<GroupResult.Member> getMembers(Long groupId) {
        List<GroupMember> groupMembers = groupMemberRepository.findJoinedMembersById(groupId);
        List<GroupResult.Member> result = groupMembers.stream().map(GroupResult.Member::from).toList();
        return result;
    }

    @Transactional
    public GroupResult.GroupInfo updateGroup(GroupCommand.Update command) {
        Group group = groupRepository.findById(command.getGroupId()).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        group.update(command.getName(), command.getDescription(), command.getThumbnailUrl());
        GroupResult.GroupInfo result = GroupResult.GroupInfo.from(group);
        return result;
    }

    @Transactional
    public void leaveGroup(GroupCommand.Leave command) {
        GroupMember groupMember = groupMemberRepository.findByGroupIdAndMemberIdAndStatus(command.getGroupId(), command.getMemberId(), GroupMemberStatus.ACCEPTED).orElseThrow(() -> new BaseException(NOT_FOUND));
        groupMember.leave();
    }

    private void createGroupWithInvitees(Group group, Member creator, List<Long> inviteeIds) {
        GroupMember groupMember = GroupMember.createGroupMember(group, creator);
        groupMember.accept();
        groupMemberRepository.save(groupMember);
        List<GroupMember> invitees = memberRepository.findAllById(inviteeIds).stream().map(invitee -> GroupMember.createGroupMember(group, invitee)).toList();
        groupMemberRepository.saveAll(invitees);
    }

}
