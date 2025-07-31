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
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.ssafy.keepick.common.exception.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupInvitationService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MemberRepository memberRepository;
    private final RedisService redisService;

    @Value("${app.frontend.url")
    private String frontendUrl;

    public List<GroupResult.GroupMemberInfo> invite(GroupCommand.Invite command) {
        Group group = groupRepository.findById(command.getGroupId()).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        List<GroupMember> invitees = command.getMemberIds().stream().map(m -> inviteMemberToGroup(group, m)).toList();
        List<GroupResult.GroupMemberInfo> result = invitees.stream().map(GroupResult.GroupMemberInfo::from).toList();
        return result;
    }

    public GroupResult.GroupMemberInfo acceptInvitation(Long groupMemberId) {
        GroupMember groupMember = groupMemberRepository.findPendingInvitationById(groupMemberId).orElseThrow(() -> new BaseException(INVITATION_NOT_FOUND));
        groupMember.accept();
        GroupResult.GroupMemberInfo result = GroupResult.GroupMemberInfo.from(groupMember);
        return result;
    }

    public GroupResult.GroupMemberInfo rejectInvitation(Long groupMemberId) {
        GroupMember groupMember = groupMemberRepository.findPendingInvitationById(groupMemberId).orElseThrow(() -> new BaseException(INVITATION_NOT_FOUND));
        groupMember.reject();
        GroupResult.GroupMemberInfo result = GroupResult.GroupMemberInfo.from(groupMember);
        return result;
    }

    public GroupResult.Link createInvitationLink(Long groupId) {
        // 유효기간이 하루인 초대 토큰 생성
        String inviteToken = UUID.randomUUID().toString();
        redisService.setValue("invite:" + inviteToken, String.valueOf(groupId), Duration.ofDays(1));
        GroupResult.Link result = GroupResult.Link.from(frontendUrl, inviteToken);
        return result;
    }

    public GroupResult.GroupMemberInfo joinGroupByInvitationLink(GroupCommand.Link command) {
        // 초대 토큰 유효성 검사
        validateToken(command.getGroupId(), command.getInviteToken());
        // 그룹 가입
        Group group = groupRepository.findById(command.getGroupId()).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        GroupMember groupMember = inviteMemberToGroup(group, command.getMemberId());
        groupMember.accept();
        return GroupResult.GroupMemberInfo.from(groupMember);
    }

    private void validateToken(Long groupId, String inviteToken) {
        String value = redisService.getValue("invite:" + inviteToken);
        if (groupId.toString().equals(value)) throw new BaseException(INVITATION_TOKEN_NOT_FOUND);
    }

    private GroupMember inviteMemberToGroup(Group group, Long memberId) {
        // 초대할 멤버 중 이전에 초대받은 기록이 있는지 확인
        Optional<GroupMember> pastInvitation = groupMemberRepository.findByGroupIdAndMemberId(group.getId(), memberId);
        return pastInvitation.map(GroupInvitationService::reinviteMember).orElseGet(() -> inviteMember(group, memberId));
    }

    private GroupMember inviteMember(Group group, Long memberId) {
        Member member = memberRepository.findById(memberId).orElseThrow(() -> new BaseException(NOT_FOUND));
        GroupMember groupMember = GroupMember.createGroupMember(group, member);
        groupMemberRepository.save(groupMember);
        return groupMember;
    }

    private static GroupMember reinviteMember(GroupMember groupMember) {
        // 이미 그룹에 가입한 회원일 경우 재초대할 수 없음
        if(groupMember.getStatus() == GroupMemberStatus.ACCEPTED) throw new BaseException(INVITATION_DUPLICATE);
        groupMember.invite(); // 그룹에 초대
        return groupMember;
    }

}
