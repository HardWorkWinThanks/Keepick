package com.ssafy.keepick.group.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.controller.request.GroupInviteRequest;
import com.ssafy.keepick.group.controller.response.GroupInviteResponse;
import com.ssafy.keepick.group.controller.response.GroupLinkResponse;
import com.ssafy.keepick.group.application.GroupInvitationService;
import com.ssafy.keepick.group.application.dto.GroupMemberDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupInvitationController {

    private final GroupInvitationService groupInvitationService;

    @PostMapping("/{groupId}/invitations")
    public ApiResponse<List<GroupInviteResponse>> createInvitation(@PathVariable Long groupId, @Valid @RequestBody GroupInviteRequest request) {
        List<GroupMemberDto> dto = groupInvitationService.createInvitation(request, groupId);
        List<GroupInviteResponse> response = dto.stream().map(GroupInviteResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @PostMapping("/{groupId}/invitations/{invitationId}")
    public ApiResponse<GroupInviteResponse> acceptInvitation(@PathVariable Long invitationId) {
        GroupMemberDto dto = groupInvitationService.acceptInvitation(invitationId);
        GroupInviteResponse response = GroupInviteResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @DeleteMapping("/{groupId}/invitations/{invitationId}")
    public ApiResponse<GroupInviteResponse> rejectInvitation(@PathVariable Long invitationId) {
        GroupMemberDto dto = groupInvitationService.rejectInvitation(invitationId);
        GroupInviteResponse response = GroupInviteResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @PostMapping("/{groupId}/invitation-link")
    public ApiResponse<GroupLinkResponse> createInvitationLink(@PathVariable Long groupId) {
        String dto = groupInvitationService.createInvitationLink(groupId);
        GroupLinkResponse response = GroupLinkResponse.toResponse(dto);
        return ApiResponse.created(response);
    }

    @GetMapping("/{groupId}/invitation-link/{invitation-link}")
    public ApiResponse<GroupInviteResponse> getInvitationLink(@PathVariable Long groupId, @PathVariable("invitation-link") String inviteToken) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        GroupMemberDto dto = groupInvitationService.joinGroupByInvitationLink(groupId, loginMemberId, inviteToken);
        GroupInviteResponse response = GroupInviteResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

}
