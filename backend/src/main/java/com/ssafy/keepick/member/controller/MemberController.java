package com.ssafy.keepick.member.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.member.application.MemberService;
import com.ssafy.keepick.member.controller.response.MemberInfoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {
    
    private final MemberService memberService;
    
    /**
     * 현재 로그인된 사용자의 정보를 조회합니다.
     * @return 사용자 정보 응답
     */
    @GetMapping("/me")
    public ApiResponse<MemberInfoResponse> getCurrentMemberInfo() {
        MemberInfoResponse response = memberService.getCurrentMemberInfo();
        return ApiResponse.ok(response);
    }
}