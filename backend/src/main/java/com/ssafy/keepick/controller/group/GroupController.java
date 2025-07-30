package com.ssafy.keepick.controller.group;

import com.ssafy.keepick.common.exception.BaseException;
import com.ssafy.keepick.common.exception.ErrorCode;
import com.ssafy.keepick.common.response.ApiResponse;
import com.ssafy.keepick.common.response.ResponseCode;
import com.ssafy.keepick.entity.GroupMemberStatus;
import com.ssafy.keepick.service.group.GroupCommand;
import com.ssafy.keepick.service.group.GroupResult;
import com.ssafy.keepick.service.group.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping("")
    public ApiResponse<?> create(
            @Valid @RequestBody GroupRequest.Create request) {
        GroupCommand.Create command = request.toCommand(1L);
        GroupResult.GroupInfo result = groupService.createGroup(command);
        return ApiResponse.created(GroupResponse.Creation.from(result));
    }

    @GetMapping("")
    public ApiResponse<?> list(@RequestParam(required = true, defaultValue = "accepted") String status) {
        GroupCommand.MyGroup command = null;
        try {
            command = new GroupCommand.MyGroup(1L, GroupMemberStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BaseException(ErrorCode.INVALID_PARAMETER);
        }
        List<GroupResponse.MyGroup> response = groupService.getGroups(command).stream().map(GroupResponse.MyGroup::from).toList();
        return ApiResponse.ok(response);
    }

    @GetMapping("/{groupId}")
    public ApiResponse<?> detail(@PathVariable Long groupId) {
        GroupResult.GroupInfo result = groupService.getGroup(groupId);
        return ApiResponse.ok(GroupResponse.Detail.from(result));
    }

    @GetMapping("/{groupId}/members")
    public ApiResponse<?> groupMembers(@PathVariable Long groupId) {
        List<GroupResponse.Member> response = groupService.getMembers(groupId).stream().map(GroupResponse.Member::from).toList();
        return ApiResponse.ok(response);
    }

    @PutMapping("/{groupId}")
    public ApiResponse<?> update(@PathVariable Long groupId, @RequestBody GroupRequest.Update request) {
        GroupResult.GroupInfo result = groupService.updateGroup(request.toCommand(groupId));
        return ApiResponse.ok(GroupResponse.Detail.from(result));
    }

    @DeleteMapping("/{groupId}/me")
    public ApiResponse<?> leave(@PathVariable Long groupId) {
        groupService.leaveGroup(new GroupCommand.Leave(groupId, 1L));
        return ApiResponse.of(ResponseCode.DELETED);
    }

    @PostMapping("/{groupId}/invitations")
    public ApiResponse<?> createInvitation(@PathVariable Long groupId, @RequestBody GroupRequest.Invite request) {
        List<GroupResponse.Invitation> response = groupService.invite(request.toCommand(groupId)).stream().map(GroupResponse.Invitation::from).toList();
        return ApiResponse.ok(response);
    }

    @PostMapping("/{groupId}/invitations/{invitationId}")
    public ApiResponse<?> acceptInvitation(@PathVariable Long invitationId) {
        GroupResult.GroupMemberInfo result = groupService.acceptInvitation(invitationId);
        return ApiResponse.ok(GroupResponse.Invitation.from(result));
    }

    @DeleteMapping("/{groupId}/invitations/{invitationId}")
    public ApiResponse<?> rejectInvitation(@PathVariable Long invitationId) {
        GroupResult.GroupMemberInfo result = groupService.rejectInvitation(invitationId);
        return ApiResponse.ok(GroupResponse.Invitation.from(result));
    }

}
