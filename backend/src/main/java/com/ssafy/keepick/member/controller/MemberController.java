package com.ssafy.keepick.member.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.keepick.auth.application.dto.MemberDto;
import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.member.application.MemberService;
import com.ssafy.keepick.member.controller.request.MemberUpdateRequest;
import com.ssafy.keepick.member.controller.response.MemberInfoResponse;
import com.ssafy.keepick.member.controller.response.MemberSearchResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    /**
     * 현재 로그인된 사용자의 정보를 조회합니다.
     * 
     * @return 사용자 정보 응답
     */
    @GetMapping("/me")
    public ApiResponse<MemberInfoResponse> getCurrentMemberInfo() {
        MemberDto memberDto = memberService.getCurrentMemberInfo();
        MemberInfoResponse response = MemberInfoResponse.from(memberDto);
        return ApiResponse.ok(response);
    }
    
    /**
     * 현재 로그인된 사용자의 정보를 수정합니다.
     * 
     * @param request 수정할 정보 (닉네임, 프로필 이미지 URL, 신분증 이미지 URL 중 최소 하나)
     * @return 수정된 사용자 정보 응답
     */
    @PatchMapping("/me")
    public ApiResponse<MemberInfoResponse> updateCurrentMemberInfo(@RequestBody MemberUpdateRequest request) {
        MemberDto memberDto = memberService.updateCurrentMemberInfo(request);
        MemberInfoResponse response = MemberInfoResponse.from(memberDto);
        return ApiResponse.ok(response);
    }
    
    /**
     * 닉네임으로 사용자를 검색합니다.
     * 
     * @param nickname 검색할 닉네임 (쿼리 파라미터)
     * @return 검색된 사용자 정보
     */
    @GetMapping
    public ApiResponse<MemberSearchResponse> searchMemberByNickname(@RequestParam String nickname) {
        MemberDto memberDto = memberService.searchMemberByNickname(nickname);
        MemberSearchResponse response = MemberSearchResponse.from(memberDto);
        return ApiResponse.ok(response);
    }
}