package com.ssafy.keepick.controller.group;

import com.ssafy.keepick.common.response.ApiResponse;
import com.ssafy.keepick.controller.group.request.GroupInviteRequest;
import com.ssafy.keepick.controller.group.response.GroupInviteResponse;
import com.ssafy.keepick.controller.group.response.GroupLinkResponse;
import com.ssafy.keepick.service.group.GroupInvitationService;
import com.ssafy.keepick.service.group.dto.GroupMemberDto;
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
        GroupMemberDto dto = groupInvitationService.joinGroupByInvitationLink(groupId, 1L, inviteToken);
        GroupInviteResponse response = GroupInviteResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

}
