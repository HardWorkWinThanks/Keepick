package com.ssafy.keepick.group.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.response.ResponseCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.controller.request.GroupCreateRequest;
import com.ssafy.keepick.group.controller.request.GroupUpdateRequest;
import com.ssafy.keepick.group.controller.response.GroupCreateResponse;
import com.ssafy.keepick.group.controller.response.GroupDetailResponse;
import com.ssafy.keepick.group.controller.response.GroupMemberResponse;
import com.ssafy.keepick.group.controller.response.GroupStatusResponse;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.group.application.GroupService;
import com.ssafy.keepick.group.application.dto.GroupDto;
import com.ssafy.keepick.group.application.dto.GroupMemberDto;
import com.ssafy.keepick.group.application.dto.MemberDto;
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
    public ApiResponse<GroupCreateResponse> createGroup(@Valid @RequestBody GroupCreateRequest request) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        GroupDto dto = groupService.createGroup(request, loginMemberId);
        GroupCreateResponse response = GroupCreateResponse.toResponse(dto);
        return ApiResponse.created(response);
    }

    @GetMapping("")
    public ApiResponse<List<GroupStatusResponse>> getGroupList(@RequestParam(defaultValue = "ACCEPTED") GroupMemberStatus status) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        List<GroupMemberDto> dto = groupService.getGroupList(loginMemberId, status);
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
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        groupService.leaveGroup(groupId, loginMemberId);
        return ApiResponse.of(ResponseCode.DELETED);
    }

}
