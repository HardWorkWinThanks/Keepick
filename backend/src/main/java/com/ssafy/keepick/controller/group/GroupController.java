package com.ssafy.keepick.controller.group;

import com.ssafy.keepick.common.response.ApiResponse;
import com.ssafy.keepick.common.response.ResponseCode;
import com.ssafy.keepick.controller.group.request.GroupCreateRequest;
import com.ssafy.keepick.controller.group.request.GroupUpdateRequest;
import com.ssafy.keepick.controller.group.response.GroupCreateResponse;
import com.ssafy.keepick.controller.group.response.GroupDetailResponse;
import com.ssafy.keepick.controller.group.response.GroupMemberResponse;
import com.ssafy.keepick.controller.group.response.GroupStatusResponse;
import com.ssafy.keepick.entity.GroupMemberStatus;
import com.ssafy.keepick.service.group.GroupService;
import com.ssafy.keepick.service.group.dto.GroupDto;
import com.ssafy.keepick.service.group.dto.GroupMemberDto;
import com.ssafy.keepick.service.group.dto.MemberDto;
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
    public ApiResponse<GroupCreateResponse> createGroup(
            @Valid @RequestBody GroupCreateRequest request) {
        GroupDto dto = groupService.createGroup(request, 1L);
        GroupCreateResponse response = GroupCreateResponse.toResponse(dto);
        return ApiResponse.created(response);
    }

    @GetMapping("")
    public ApiResponse<List<GroupStatusResponse>> getGroupList(@RequestParam(defaultValue = "ACCEPTED") GroupMemberStatus status) {
        List<GroupMemberDto> dto = groupService.getGroupList(1L, status);
        List<GroupStatusResponse> response = dto.stream().map(GroupStatusResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @GetMapping("/{groupId}")
    public ApiResponse<GroupDetailResponse> getGroupDetail(@PathVariable Long groupId) {
        GroupDto dto = groupService.getGroup(groupId);
        GroupDetailResponse response = GroupDetailResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @GetMapping("/{groupId}/members")
    public ApiResponse<List<GroupMemberResponse>> getGroupMemberList(@PathVariable Long groupId) {
        List<MemberDto> dto = groupService.getGroupMembers(groupId);
        List<GroupMemberResponse> response = dto.stream().map(GroupMemberResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @PutMapping("/{groupId}")
    public ApiResponse<GroupDetailResponse> updateGroup(@PathVariable Long groupId, @Valid @RequestBody GroupUpdateRequest request) {
        GroupDto dto = groupService.updateGroup(request, groupId);
        GroupDetailResponse response = GroupDetailResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @DeleteMapping("/{groupId}/me")
    public ApiResponse<Void> leaveGroup(@PathVariable Long groupId) {
        groupService.leaveGroup(groupId, 1L);
        return ApiResponse.of(ResponseCode.DELETED);
    }

}
