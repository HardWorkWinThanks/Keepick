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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @Operation(summary = "그룹 생성", description = "그룹 이름으로 새 그룹을 생성합니다.")
    @PostMapping("")
    public ApiResponse<GroupCreateResponse> createGroup(@Parameter(description = "그룹 이름") @Valid @RequestBody GroupCreateRequest request) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        GroupDto dto = groupService.createGroup(request, loginMemberId);
        GroupCreateResponse response = GroupCreateResponse.toResponse(dto);
        return ApiResponse.created(response);
    }

    @Operation(summary = "그룹 목록 조회", description = "로그인한 사용자가 가입한/초대받은/거절한 그룹 목록을 조회합니다.")
    @GetMapping("")
    public ApiResponse<List<GroupStatusResponse>> getGroupList(@Parameter(description = "조회할 그룹의 가입 상태") @RequestParam(defaultValue = "ACCEPTED") GroupMemberStatus status) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        List<GroupMemberDto> dto = groupService.getGroupList(loginMemberId, status);
        List<GroupStatusResponse> response = dto.stream().map(GroupStatusResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @Operation(summary = "그룹 상세 조회", description = "그룹의 상세 정보를 조회합니다.")
    @GetMapping("/{groupId}")
    public ApiResponse<GroupDetailResponse> getGroupDetail(@PathVariable Long groupId) {
        GroupDto dto = groupService.getGroup(groupId);
        GroupDetailResponse response = GroupDetailResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "그룹 회원 조회", description = "그룹에 가입한 회원을 조회합니다.")
    @GetMapping("/{groupId}/members")
    public ApiResponse<List<GroupMemberResponse>> getGroupMemberList(@PathVariable Long groupId) {
        List<MemberDto> dto = groupService.getGroupMembers(groupId);
        List<GroupMemberResponse> response = dto.stream().map(GroupMemberResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @Operation(summary = "그룹 정보 수정", description = "그룹의 이름, 설명, 썸네일을 수정합니다.")
    @PutMapping("/{groupId}")
    public ApiResponse<GroupDetailResponse> updateGroup(@PathVariable Long groupId, @Parameter(description = "수정할 그룹 정보") @Valid @RequestBody GroupUpdateRequest request) {
        GroupDto dto = groupService.updateGroup(request, groupId);
        GroupDetailResponse response = GroupDetailResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "그룹 탈퇴", description = "로그인한 유저가 그룹에서 탈퇴합니다.")
    @DeleteMapping("/{groupId}/me")
    public ApiResponse<Void> leaveGroup(@PathVariable Long groupId) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        groupService.leaveGroup(groupId, loginMemberId);
        return ApiResponse.of(ResponseCode.DELETED);
    }

}
