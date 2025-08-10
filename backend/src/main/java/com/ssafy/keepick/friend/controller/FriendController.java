package com.ssafy.keepick.friend.controller;

import com.ssafy.keepick.friend.application.FriendInteractionService;
import com.ssafy.keepick.friend.application.FriendService;
import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.controller.request.FriendCreateRequest;
import com.ssafy.keepick.friend.application.dto.FriendStatus;
import com.ssafy.keepick.friend.controller.response.FriendCreateResponse;
import com.ssafy.keepick.friend.controller.response.FriendDetailResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
@Tag(name="Friend", description = "친구 관련 API")
public class FriendController {

    private final FriendService friendService;
    private final FriendInteractionService friendInteractionService;

    @Operation(summary = "친구 목록 조회", description = "로그인한 사용자의 친구/요청한/요청받은 친구 목록을 조회합니다.")
    @GetMapping("")
    public ApiResponse<List<FriendDetailResponse>> getFriendList(
            @Parameter(description = "조회할 친구 상태 조건: FRIEND(친구인 회원), SENT(로그인한 유저가 친구 요청을 보낸 회원), RECEIVED(로그인한 유저에게 친구 요청을 보낸 회원)")
            @RequestParam(defaultValue = "FRIEND") FriendStatus status) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        List<FriendshipDto> dto = friendService.getFriendList(loginMemberId, status);
        List<FriendDetailResponse> response = dto.stream().map(FriendDetailResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @Operation(summary = "친구 요청 생성", description = "로그인한 사용자가 다른 회원에게 친구 요청을 합니다.")
    @PostMapping("")
    public ApiResponse<FriendCreateResponse> createFriendRequest(@Valid @RequestBody FriendCreateRequest request) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        FriendshipDto dto = friendInteractionService.createFriendRequest(request, loginMemberId);
        FriendCreateResponse response = FriendCreateResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "친구 요청 수락", description = "로그인한 사용자가 받은 친구 요청을 수락합니다.")
    @PostMapping("/requests/{invitationId}")
    public ApiResponse<FriendDetailResponse> acceptFriendRequest(@Parameter(name = "친구 요청 ID") @PathVariable Long invitationId) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        FriendshipDto dto = friendInteractionService.acceptFriendRequest(invitationId, loginMemberId);
        FriendDetailResponse response = FriendDetailResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "친구 요청 수락", description = "로그인한 사용자가 받은 친구 요청을 거절합니다.")
    @DeleteMapping("/requests/{invitationId}")
    public ApiResponse<FriendDetailResponse> rejectFriendRequest(@Parameter(name = "친구 요청 ID") @PathVariable Long invitationId) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        FriendshipDto dto = friendInteractionService.rejectFriendRequest(invitationId, loginMemberId);
        FriendDetailResponse response = FriendDetailResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

}
