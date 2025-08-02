package com.ssafy.keepick.service.group;

import com.ssafy.keepick.common.exception.BaseException;
import com.ssafy.keepick.controller.group.request.GroupCreateRequest;
import com.ssafy.keepick.controller.group.request.GroupUpdateRequest;
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
    public GroupDto createGroup(GroupCreateRequest request, Long memberId) {
        // 그룹 생성
        Member member = memberRepository.findById(memberId).orElseThrow(() -> new BaseException(NOT_FOUND));
        Group group = Group.createGroup(request.getName(), member);
        groupRepository.save(group);
        // 그룹 생성자는 그룹에 가입
        joinCreatorToGroup(group, member);
        GroupDto dto = GroupDto.from(group);
        return dto;
    }

    public List<GroupMemberDto> getGroupList(Long memberId, GroupMemberStatus status) {
        List<GroupMember> groupMembers = groupMemberRepository.findGroupsByMember(memberId, status);
        List<GroupMemberDto> dto = groupMembers.stream().map(GroupMemberDto::from).toList();
        return dto;
    }

    public GroupDto getGroup(Long groupId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        GroupDto dto = GroupDto.from(group);
        return dto;
    }

    public List<MemberDto> getGroupMembers(Long groupId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        List<GroupMember> groupMembers = groupMemberRepository.findJoinedMembersById(groupId);
        List<MemberDto> dto = groupMembers.stream().map(MemberDto::from).toList();
        return dto;
    }

    @Transactional
    public GroupDto updateGroup(GroupUpdateRequest request, Long groupId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        group.update(request.getName(), request.getDescription(), request.getThumbnailUrl());
        GroupDto dto = GroupDto.from(group);
        return dto;
    }

    @Transactional
    public void leaveGroup(Long groupId, Long memberId) {
        GroupMember groupMember = groupMemberRepository.findByGroupIdAndMemberIdAndStatus(groupId, memberId, GroupMemberStatus.ACCEPTED).orElseThrow(() -> new BaseException(NOT_FOUND));
        groupMember.leave();
    }

    private void joinCreatorToGroup(Group group, Member creator) {
        GroupMember groupMember = GroupMember.createGroupMember(group, creator);
        groupMember.accept();
        groupMemberRepository.save(groupMember);    }

}
