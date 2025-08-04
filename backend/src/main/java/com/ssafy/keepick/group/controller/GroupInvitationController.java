package com.ssafy.keepick.group.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.controller.request.GroupInviteRequest;
import com.ssafy.keepick.group.controller.response.GroupInviteResponse;
import com.ssafy.keepick.group.controller.response.GroupLinkResponse;
import com.ssafy.keepick.group.application.GroupInvitationService;
import com.ssafy.keepick.group.application.dto.GroupMemberDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupInvitationController {

    private final GroupInvitationService groupInvitationService;

    @Operation(summary = "그룹 초대 요청", description = "특정 사용자에게 그룹 초대 요청을 보냅니다.")
    @PostMapping("/{groupId}/invitations")
    public ApiResponse<List<GroupInviteResponse>> createInvitation(@PathVariable Long groupId, @Parameter(description = "그룹에 초대할 회원들의 ID") @Valid @RequestBody GroupInviteRequest request) {
        List<GroupMemberDto> dto = groupInvitationService.createInvitation(request, groupId);
        List<GroupInviteResponse> response = dto.stream().map(GroupInviteResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @Operation(summary = "그룹 초대 수락", description = "로그인한 사용자가 그룹 초대를 수락합니다.")
    @PostMapping("/{groupId}/invitations/{invitationId}")
    public ApiResponse<GroupInviteResponse> acceptInvitation(@PathVariable Long invitationId) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        GroupMemberDto dto = groupInvitationService.acceptInvitation(invitationId, loginMemberId);
        GroupInviteResponse response = GroupInviteResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "그룹 초대 거절", description = "로그인한 사용자가 그룹 초대를 거절합니다.")
    @DeleteMapping("/{groupId}/invitations/{invitationId}")
    public ApiResponse<GroupInviteResponse> rejectInvitation(@PathVariable Long invitationId) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        GroupMemberDto dto = groupInvitationService.rejectInvitation(invitationId, loginMemberId);
        GroupInviteResponse response = GroupInviteResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "그룹 초대 링크 생성", description = "특정 그룹의 초대 링크를 생성합니다.")
    @PostMapping("/{groupId}/invitation-link")
    public ApiResponse<GroupLinkResponse> createInvitationLink(@PathVariable Long groupId) {
        String dto = groupInvitationService.createInvitationLink(groupId);
        GroupLinkResponse response = GroupLinkResponse.toResponse(dto);
        return ApiResponse.created(response);
    }

    @Operation(summary = "그룹 초대 링크로 그룹 가입", description = "로그인한 사용자가 그룹 초대 링크를 통해 그룹에 가입합니다.")
    @GetMapping("/{groupId}/invitation-link/{invitation-link}")
    public ApiResponse<GroupInviteResponse> getInvitationLink(@PathVariable Long groupId, @PathVariable("invitation-link") String inviteToken) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        GroupMemberDto dto = groupInvitationService.joinGroupByInvitationLink(groupId, loginMemberId, inviteToken);
        GroupInviteResponse response = GroupInviteResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

}
