package com.ssafy.keepick.friend.controller;

import com.ssafy.keepick.friend.application.FriendInteractionService;
import com.ssafy.keepick.friend.application.FriendService;
import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.controller.request.FriendCreateRequest;
import com.ssafy.keepick.friend.application.FriendStatus;
import com.ssafy.keepick.friend.controller.response.FriendCreateResponse;
import com.ssafy.keepick.friend.controller.response.FriendDetailResponse;
import com.ssafy.keepick.friend.controller.response.FriendStatusChangeResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;
    private final FriendInteractionService friendInteractionService;

    @Operation(summary = "친구 목록 조회", description = "로그인한 사용자의 친구/요청한/요청받은 친구 목록을 조회합니다.")
    @GetMapping("")
    public ApiResponse<List<FriendDetailResponse>> getFriendList(@Parameter(description = "조회할 친구 조건")  @RequestParam(defaultValue = "FRIEND") FriendStatus status) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        List<FriendshipDto> dto = friendService.getFriendList(loginMemberId, status);
        List<FriendDetailResponse> response = dto.stream().map(FriendDetailResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @Operation(summary = "친구 요청 생성", description = "로그인한 사용자가 다른 회원에게 친구 요청을 합니다.")
    @PostMapping("")
    public ApiResponse<FriendCreateResponse> createFriendRequest(@Parameter(description = "친구 요청할 회원의 ID") @Valid @RequestBody FriendCreateRequest request) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        FriendshipDto dto = friendInteractionService.createFriendRequest(request, loginMemberId);
        FriendCreateResponse response = FriendCreateResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "친구 요청 수락", description = "로그인한 사용자가 받은 친구 요청을 수락합니다.")
    @PostMapping("/requests/{requestId}")
    public ApiResponse<FriendStatusChangeResponse> acceptFriendRequest(@PathVariable Long requestId) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        FriendshipDto dto = friendInteractionService.acceptFriendRequest(requestId, loginMemberId);
        FriendStatusChangeResponse response = FriendStatusChangeResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "친구 요청 수락", description = "로그인한 사용자가 받은 친구 요청을 거절합니다.")
    @DeleteMapping("/requests/{requestId}")
    public ApiResponse<FriendStatusChangeResponse> rejectFriendRequest(@PathVariable Long requestId) {
        Long loginMemberId = AuthenticationUtil.getCurrentUserId();
        FriendshipDto dto = friendInteractionService.rejectFriendRequest(requestId, loginMemberId);
        FriendStatusChangeResponse response = FriendStatusChangeResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

}
