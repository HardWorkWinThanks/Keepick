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
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.ssafy.keepick.common.exception.ErrorCode.*;
import static com.ssafy.keepick.common.exception.ErrorCode.INVITATION_NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MemberRepository memberRepository;
    private final RedisService redisService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;


    public GroupResult.GroupInfo createGroup(GroupCommand.Create command) {
        // 그룹 생성
        Member member = memberRepository.findById(command.getMemberId()).orElseThrow(() -> new BaseException(NOT_FOUND));
        Group group = new Group(command.getName(), member);
        groupRepository.save(group);
        // 그룹에 가입
        GroupMember groupMember = new GroupMember(group, member, GroupMemberStatus.ACCEPTED);
        groupMemberRepository.save(groupMember);
        List<GroupMember> invitees = memberRepository.findAllById(command.getMembers()).stream().map(m -> new GroupMember(group, m)).toList();
        groupMemberRepository.saveAll(invitees);
        return GroupResult.GroupInfo.from(group);
    }

    public List<GroupResult.GroupMemberInfo> getGroups(GroupCommand.MyGroup command) {
        return groupMemberRepository
                .findGroupsByMember(command.getMemberId(), command.getStatus())
                .stream()
                .map(GroupResult.GroupMemberInfo::from)
                .toList();
    }

    public GroupResult.GroupInfo getGroup(Long groupId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        return GroupResult.GroupInfo.from(group);
    }

    public List<GroupResult.Member> getMembers(Long groupId) {
        return groupMemberRepository.findJoinedMembersById(groupId).stream().map(GroupResult.Member::from).toList();
    }

    public GroupResult.GroupInfo updateGroup(GroupCommand.Update command) {
        Group group = groupRepository.findById(command.getGroupId()).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        group.update(command.getName(), command.getDescription(), command.getThumbnailUrl());
        return GroupResult.GroupInfo.from(group);
    }

    public void leaveGroup(GroupCommand.Leave command) {
        GroupMember groupMember = groupMemberRepository.findByGroupIdAndMemberIdAndStatusAndDeletedAtIsNull(command.getGroupId(), command.getMemberId(), GroupMemberStatus.ACCEPTED).orElseThrow(() -> new BaseException(NOT_FOUND));
        groupMember.delete();
    }

    public List<GroupResult.GroupMemberInfo> invite(GroupCommand.Invite command) {
        Group group = groupRepository.findById(command.getGroupId()).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        List<GroupMember> invitees = command.getMembers().stream().map(m -> inviteMemberToGroup(group, m)).toList();
        return invitees.stream().map(GroupResult.GroupMemberInfo::from).toList();
    }

    public GroupResult.GroupMemberInfo acceptInvitation(Long groupMemberId) {
        GroupMember groupMember = groupMemberRepository.findByIdAndStatusAndDeletedAtIsNull(groupMemberId, GroupMemberStatus.PENDING).orElseThrow(() -> new BaseException(INVITATION_NOT_FOUND));
        groupMember.accept();
        return GroupResult.GroupMemberInfo.from(groupMember);
    }

    public GroupResult.GroupMemberInfo rejectInvitation(Long groupMemberId) {
        GroupMember groupMember = groupMemberRepository.findByIdAndStatusAndDeletedAtIsNull(groupMemberId, GroupMemberStatus.PENDING).orElseThrow(() -> new BaseException(INVITATION_NOT_FOUND));
        groupMember.reject();
        return GroupResult.GroupMemberInfo.from(groupMember);
    }

    public GroupResult.Link createInvitationLink(Long groupId) {
        String inviteToken = UUID.randomUUID().toString();
        redisService.setValue("invite:" + inviteToken, String.valueOf(groupId));
        return GroupResult.Link.from(frontendUrl, inviteToken);
    }

    public GroupResult.GroupMemberInfo joinGroupByInvitationLink(GroupCommand.Link command) {
        // 초대 토큰 유효성 검사
        String value = redisService.getValue("invite:" + command.getInviteToken());
        if(value == null) throw new BaseException(INVITATION_EXPIRED);
        if (!String.valueOf(command.getGroupId()).equals(value)) throw new BaseException(INVITATION_INVALID_PARAMETER);
        // 그룹 가입
        Group group = groupRepository.findById(command.getGroupId()).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        GroupMember groupMember = inviteMemberToGroup(group, command.getMemberId());
        groupMember.accept();
        return GroupResult.GroupMemberInfo.from(groupMember);
    }

    private GroupMember inviteMemberToGroup(Group group, Long memberId) {
        // 초대할 멤버 중 이전에 초대받은 기록이 있는지 확인
        Optional<GroupMember> pastInvitation = groupMemberRepository.findByGroupIdAndMemberId(group.getId(), memberId);
        if (pastInvitation.isPresent()) {
            GroupMember groupMember = pastInvitation.get();
            if(groupMember.getDeletedAt() == null && groupMember.getStatus() == GroupMemberStatus.ACCEPTED) throw new BaseException(INVITATION_DUPLICATE); // 이미 가입한 그룹의 경우 에러 발생
            if(groupMember.getDeletedAt() != null) groupMember.undelete(); // 그룹 탈퇴 취소
            groupMember.invite(); // 그룹에 초대
            return groupMember;
        } else {
            Member member = memberRepository.findById(memberId).orElseThrow(() -> new BaseException(NOT_FOUND));
            GroupMember groupMember = new GroupMember(group, member);
            groupMemberRepository.save(groupMember);
            return groupMember;
        }

    }

}
