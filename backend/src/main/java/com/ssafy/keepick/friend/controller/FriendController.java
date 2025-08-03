package com.ssafy.keepick.friend.controller;

import com.ssafy.keepick.auth.application.dto.CustomOAuth2Member;
import com.ssafy.keepick.friend.application.FriendService;
import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.controller.request.FriendCreateRequest;
import com.ssafy.keepick.friend.controller.request.FriendRequestStatus;
import com.ssafy.keepick.friend.controller.response.FriendCreateResponse;
import com.ssafy.keepick.friend.controller.response.FriendDetailResponse;
import com.ssafy.keepick.friend.controller.response.FriendResultResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping("")
    public ApiResponse<?> getFriendList(@RequestParam(defaultValue = "FRIENDS") FriendRequestStatus status, Authentication authentication) {
        Long loginMemberId = getLoginMemberId(authentication);
        List<FriendshipDto> dto = friendService.getFriendList(loginMemberId, status);
        List<FriendDetailResponse> response = dto.stream().map(FriendDetailResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @PostMapping("")
    public ApiResponse<?> createFriendRequest(@Valid @RequestBody FriendCreateRequest request, Authentication authentication) {
        Long loginMemberId = getLoginMemberId(authentication);
        FriendshipDto dto = friendService.createFriendRequest(request, loginMemberId);
        FriendCreateResponse response = FriendCreateResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @PostMapping("/requests/{requestId}")
    public ApiResponse<?> acceptFriendRequest(@PathVariable Long requestId, Authentication authentication) {
        Long loginMemberId = getLoginMemberId(authentication);
        FriendshipDto dto = friendService.acceptFriendRequest(requestId, loginMemberId);
        FriendResultResponse response = FriendResultResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    @DeleteMapping("/requests/{requestId}")
    public ApiResponse<?> rejectFriendRequest(@PathVariable Long requestId, Authentication authentication) {
        Long loginMemberId = getLoginMemberId(authentication);
        FriendshipDto dto = friendService.rejectFriendRequest(requestId, loginMemberId);
        FriendResultResponse response = FriendResultResponse.toResponse(dto);
        return ApiResponse.ok(response);
    }

    private Long getLoginMemberId(Authentication authentication) {
        CustomOAuth2Member loginMember = (CustomOAuth2Member) authentication.getPrincipal();
        return loginMember.getMemberId();
    }

}
