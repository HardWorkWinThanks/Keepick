package com.ssafy.keepick.group.application;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.group.controller.request.GroupInviteRequest;
import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.group.domain.GroupMember;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.group.persistence.GroupRepository;
import com.ssafy.keepick.external.redis.RedisService;
import com.ssafy.keepick.group.application.dto.GroupMemberDto;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import static com.ssafy.keepick.global.exception.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupInvitationService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MemberRepository memberRepository;
    private final RedisService redisService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public List<GroupMemberDto> createInvitation(GroupInviteRequest request, Long groupId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        List<GroupMember> invitees = request.getInviteeIds().stream().map(inviteeId -> processInvitationToGroup(group, inviteeId)).toList();
        List<GroupMemberDto> dto = invitees.stream().map(GroupMemberDto::from).toList();
        return dto;
    }

    public GroupMemberDto acceptInvitation(Long groupMemberId, Long loginMemberId) {
        GroupMember groupMember = findAndValidateGroupInvitation(groupMemberId, loginMemberId);
        groupMember.accept();
        GroupMemberDto dto = GroupMemberDto.from(groupMember);
        return dto;
    }

    public GroupMemberDto rejectInvitation(Long groupMemberId, Long loginMemberId) {
        GroupMember groupMember = findAndValidateGroupInvitation(groupMemberId, loginMemberId);
        groupMember.reject();
        GroupMemberDto dto = GroupMemberDto.from(groupMember);
        return dto;
    }

    public String createInvitationLink(Long groupId) {
        // 유효기간이 하루인 초대 토큰 생성
        String inviteToken = UUID.randomUUID().toString();
        redisService.setValue("invite:" + inviteToken, String.valueOf(groupId), Duration.ofDays(1));
        String link = frontendUrl + "/invite/" + inviteToken;
        return link;
    }

    public GroupMemberDto joinGroupByInvitationLink(Long groupId, Long loginMemberId, String inviteToken) {
        // 초대 토큰 유효성 검사
        validateToken(groupId, inviteToken);
        // 그룹 가입
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        GroupMember groupMember = processInvitationToGroup(group, loginMemberId);
        groupMember.accept();
        return GroupMemberDto.from(groupMember);
    }

    private void validateToken(Long groupId, String inviteToken) {
        String value = redisService.getValue("invite:" + inviteToken);
        if (!groupId.toString().equals(value)) throw new BaseException(INVITATION_TOKEN_NOT_FOUND);
    }

    private GroupMember processInvitationToGroup(Group group, Long memberId) {
        // 초대할 멤버 중 이전에 초대받은 기록이 있는지 확인
        Optional<GroupMember> pastInvitation = groupMemberRepository.findByGroupIdAndMemberId(group.getId(), memberId);
        return pastInvitation.map(GroupInvitationService::reinviteMember).orElseGet(() -> inviteMember(group, memberId));
    }

    private GroupMember inviteMember(Group group, Long memberId) {
        Member member = memberRepository.findById(memberId).orElseThrow(() -> new BaseException(MEMBER_NOT_FOUND));
        GroupMember groupMember = GroupMember.createGroupMember(group, member);
        groupMemberRepository.save(groupMember);
        return groupMember;
    }

    private static GroupMember reinviteMember(GroupMember groupMember) {
        // 이미 그룹에 가입한 회원일 경우 다시 초대할 수 없음
        if(groupMember.getStatus() != GroupMemberStatus.ACCEPTED) groupMember.invite();
        return groupMember;
    }

    private GroupMember findAndValidateGroupInvitation(Long groupMemberId, Long memberId) {
        // 초대 조회
        GroupMember groupMember = groupMemberRepository.findPendingInvitationById(groupMemberId).orElseThrow(() -> new BaseException(INVITATION_NOT_FOUND));
        // 초대받은 회원이 맞는지 확인
        if (!Objects.equals(groupMember.getMember().getId(), memberId)) {
            throw new BaseException(INVITATION_FORBIDDEN);
        }
        return groupMember;
    }

}