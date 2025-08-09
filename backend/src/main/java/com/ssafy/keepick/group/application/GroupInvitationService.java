package com.ssafy.keepick.group.application;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

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
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));

        // 기존에 저장된 초대 토큰이 있는지 확인
        String key = "invite:" + groupId.toString();
        String inviteToken = redisService.getValue(key);

        if (inviteToken == null) {
            // 토큰이 없으면 생성 & 저장
            inviteToken = UUID.randomUUID().toString();
            redisService.setValue(key, inviteToken, Duration.ofDays(7));
        } else {
            // 토큰이 이미 있으면 TTL만 연장
            redisService.expire(key, Duration.ofDays(7));
        }

        // 그룹 정보와 초대 토큰으로 JSON -> Base64 인코등
        String encodedInviteToken = encodeInviteToken(group, inviteToken);

        // 초대 링크 반환
        String link = frontendUrl + "/invite/" + encodedInviteToken;
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

    private String encodeInviteToken(Group group, String inviteToken) {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            Map<String, String> data = Map.of(
                    "groupId", group.getId().toString(),
                    "groupName", group.getName(),
                    "token", inviteToken
            );
            String json = objectMapper.writeValueAsString(data);
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(json.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new BaseException(INVITATION_TOKEN_CREATION_FAILED);
        }
    }

    private void validateToken(Long groupId, String inviteToken) {
        String value = redisService.getValue("invite:" + groupId.toString());
        if (!inviteToken.equals(value)) throw new BaseException(INVITATION_TOKEN_NOT_FOUND);
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