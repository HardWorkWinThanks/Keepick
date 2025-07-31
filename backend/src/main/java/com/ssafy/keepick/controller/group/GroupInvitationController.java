package com.ssafy.keepick.controller.group;

import com.ssafy.keepick.common.response.ApiResponse;
import com.ssafy.keepick.service.group.GroupCommand;
import com.ssafy.keepick.service.group.GroupInvitationService;
import com.ssafy.keepick.service.group.GroupResult;
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
    public ApiResponse<List<GroupResponse.Invitation>> createInvitation(@PathVariable Long groupId, @Valid @RequestBody GroupRequest.Invite request) {
        List<GroupResult.GroupMemberInfo> result = groupInvitationService.invite(request.toCommand(groupId));
        List<GroupResponse.Invitation> response = result.stream().map(GroupResponse.Invitation::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @PostMapping("/{groupId}/invitations/{invitationId}")
    public ApiResponse<GroupResponse.Invitation> acceptInvitation(@PathVariable Long invitationId) {
        GroupResult.GroupMemberInfo result = groupInvitationService.acceptInvitation(invitationId);
        GroupResponse.Invitation response = GroupResponse.Invitation.toResponse(result);
        return ApiResponse.ok(response);
    }

    @DeleteMapping("/{groupId}/invitations/{invitationId}")
    public ApiResponse<GroupResponse.Invitation> rejectInvitation(@PathVariable Long invitationId) {
        GroupResult.GroupMemberInfo result = groupInvitationService.rejectInvitation(invitationId);
        GroupResponse.Invitation response = GroupResponse.Invitation.toResponse(result);
        return ApiResponse.ok(response);
    }

    @PostMapping("/{groupId}/invitation-link")
    public ApiResponse<GroupResponse.Link> createInvitationLink(@PathVariable Long groupId) {
        GroupResult.Link result = groupInvitationService.createInvitationLink(groupId);
        GroupResponse.Link response = GroupResponse.Link.toResponse(result);
        return ApiResponse.created(response);
    }

    @GetMapping("/{groupId}/invitation-link/{invitation-link}")
    public ApiResponse<GroupResponse.Invitation> getInvitationLink(@PathVariable Long groupId, @PathVariable("invitation-link") String inviteToken) {
        GroupResult.GroupMemberInfo result = groupInvitationService.joinGroupByInvitationLink(GroupCommand.Link.of(groupId, 1L, inviteToken));
        GroupResponse.Invitation response = GroupResponse.Invitation.toResponse(result);
        return ApiResponse.ok(response);
    }

}
