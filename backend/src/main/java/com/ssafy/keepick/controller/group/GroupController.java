package com.ssafy.keepick.controller.group;

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
    public ApiResponse<GroupResponse.Creation> create(
            @Valid @RequestBody GroupRequest.Create request) {
        GroupCommand.Create command = request.toCommand(1L);
        GroupResult.GroupInfo result = groupService.createGroup(command);
        GroupResponse.Creation response = GroupResponse.Creation.toResponse(result);
        return ApiResponse.created(response);
    }

    @GetMapping("")
    public ApiResponse<List<GroupResponse.MyGroup>> list(@RequestParam(defaultValue = "ACCEPTED") GroupMemberStatus status) {
        GroupCommand.MyGroup command = GroupCommand.MyGroup.of(1L, status);
        List<GroupResult.GroupMemberInfo> result = groupService.getGroups(command);
        List<GroupResponse.MyGroup> response = result.stream().map(GroupResponse.MyGroup::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @GetMapping("/{groupId}")
    public ApiResponse<GroupResponse.Detail> detail(@PathVariable Long groupId) {
        GroupResult.GroupInfo result = groupService.getGroup(groupId);
        GroupResponse.Detail response = GroupResponse.Detail.toResponse(result);
        return ApiResponse.ok(response);
    }

    @GetMapping("/{groupId}/members")
    public ApiResponse<List<GroupResponse.Member>> groupMembers(@PathVariable Long groupId) {
        List<GroupResult.Member> result = groupService.getMembers(groupId);
        List<GroupResponse.Member> response = result.stream().map(GroupResponse.Member::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @PutMapping("/{groupId}")
    public ApiResponse<GroupResponse.Detail> update(@PathVariable Long groupId, @Valid @RequestBody GroupRequest.Update request) {
        GroupResult.GroupInfo result = groupService.updateGroup(request.toCommand(groupId));
        GroupResponse.Detail response = GroupResponse.Detail.toResponse(result);
        return ApiResponse.ok(response);
    }

    @DeleteMapping("/{groupId}/me")
    public ApiResponse<Void> leave(@PathVariable Long groupId) {
        groupService.leaveGroup(GroupCommand.Leave.of(groupId, 1L));
        return ApiResponse.of(ResponseCode.DELETED);
    }

}
